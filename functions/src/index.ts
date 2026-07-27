// medi-curator Cloud Function v2 — Gemini 프록시
// 배포: firebase deploy --only functions
// 시크릿 설정: firebase functions:secrets:set GEMINI_API_KEY
// 호스팅 리라이트: firebase.json 의 /api/curate → functions/curate

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { modelCandidates } from './modelSelection';
import { enforceCentralRateLimit } from './rateLimit';
import { USAGE_LIMIT_MESSAGES } from './usageLimits';
// 보안·정책 불변식(App Check, 인증+동의, 금지어, 언어명)은 shared.ts 한 곳에만 둔다.
// 여기서 사본을 다시 정의하면 한쪽만 강화되는 사고가 난다(R-001/R-008).
import {
  LANGUAGE_NAMES,
  newTraceId,
  requireAppCheck,
  requireAuthenticatedConsent,
  violatesForbidden,
  worthRetrying,
} from './shared';
export { adminUsageSettings } from './adminApi';

// === 글로벌 옵션 (한국 사용자 지연 최소화) ===
setGlobalOptions({ region: 'asia-northeast3', maxInstances: 10 });
if (!admin.apps.length) admin.initializeApp();
// auth 는 shared.ts 의 requireAuthenticatedConsent 가 자체적으로 잡는다.
// 여기서는 레이트리밋에 넘길 firestore 핸들만 필요하다.
const db = admin.firestore();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// === Zod 스키마 (src/schemas/curation.ts 와 동기화 필수) ===
const Language = z.enum(['ko', 'en', 'zh', 'ja', 'es']);
const RiskLevel = z.enum(['low', 'medium', 'high']);

const OTCMedication = z.object({
  name: z.string().min(1).max(120),
  purpose: z.string().min(1).max(500),
  dosage: z.string().min(1).max(500),
  warnings: z.array(z.string().max(500)).max(20),
  interactions: z.array(z.string().max(500)).max(20).optional(),
  riskLevel: RiskLevel,
});

const ExercisePlan = z.object({
  recommended: z.array(z.string().max(300)).max(20),
  avoid: z.array(z.string().max(300)).max(20),
  duration: z.string().max(200),
});

const RecoveryTimeline = z.object({
  ageGroup: z.string().max(100),
  expectedDays: z.string().max(100),
  notes: z.string().max(500),
});

// 아래 5개 필드는 safeResult() 가 응답 직전 항상 비운다(법적 포지션). 그래서
// buildSystemPrompt() 는 이들을 요구하지 않으며 — 폐기될 내용에 토큰을 쓰지 않는다 —
// 모델이 생략해도 검증이 깨지지 않도록 default 를 둔다. 모델이 굳이 채워 보내도
// safeResult() 에서 버려진다. 클라이언트 계약(src/schemas/curation.ts)은 필수 그대로:
// safeResult() 가 빈 값을 채워 보내므로 클라이언트가 받는 모양은 바뀌지 않는다.
const CurationResult = z.object({
  recommendedDepartment: z.string().min(1).max(100),
  aiAdvice: z.string().min(1).max(2000),
  otcMedications: z.array(OTCMedication).max(10).default([]),
  folkRemedies: z.array(z.string().max(300)).max(10).default([]),
  lifestyleTips: z.array(z.string().max(300)).max(15).default([]),
  exercisePrescription: ExercisePlan.default({ recommended: [], avoid: [], duration: '' }),
  recoveryTimeline: z.array(RecoveryTimeline).max(6).default([]),
  redFlags: z.array(z.string().max(300)).max(15),
  disclaimer: z.string().min(10).max(1000),
});

const CurateRequest = z.object({
  symptoms: z.string().min(3).max(4096),
  currentMedications: z.string().max(2048).default(''),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
  age: z.string().max(20).optional(),
});

const EMERGENCY_MENTAL = ['자살', '자해', '죽고 싶', '살고 싶지 않', '극단적 선택', 'suicide', 'self-harm', 'kill myself'];
const EMERGENCY_PHYSICAL = ['흉통', '가슴통증', '호흡곤란', '숨을 못 쉬', '의식잃', '의식불명', '마비', '반신마비', '안면마비', '극심한 두통', '갑작스러운 두통', '토혈', '혈변', '대량출혈', 'chest pain', 'cannot breathe', 'unconscious', 'stroke', 'heart attack'];

function detectEmergency(symptoms: string): 'mental' | 'physical' | null {
  const lower = symptoms.toLowerCase();
  if (EMERGENCY_MENTAL.some((kw) => lower.includes(kw.toLowerCase()))) return 'mental';
  if (EMERGENCY_PHYSICAL.some((kw) => lower.includes(kw.toLowerCase()))) return 'physical';
  return null;
}

function safeResult(recommendedDepartment: string, aiAdvice: string, redFlags: string[], disclaimer: string) {
  return {
    recommendedDepartment,
    aiAdvice,
    otcMedications: [],
    folkRemedies: [],
    lifestyleTips: [],
    exercisePrescription: { recommended: [], avoid: [], duration: '' },
    recoveryTimeline: [],
    redFlags,
    disclaimer,
  };
}

function emergencyResult(kind: 'mental' | 'physical') {
  if (kind === 'mental') {
    return safeResult(
      '정신건강의학과',
      '자해·자살 위험이 의심됩니다. 지금은 온라인 분석보다 즉시 도움을 받는 것이 우선입니다. 한국에서는 109 자살예방상담전화와 1577-0199 정신건강위기상담전화에 바로 연락하세요. 즉각적인 위험이 있으면 119 또는 112에 연락하거나 응급실로 이동하세요.',
      ['자해·자살 위험이 의심됨'],
      '본 정보는 의료 진단 또는 처방을 대체하지 않습니다. 긴급 상황에서는 즉시 109, 119, 112 또는 응급실을 이용하세요.',
    );
  }
  return safeResult(
    '응급의학과',
    '흉통, 호흡곤란, 의식저하, 대량출혈 등 응급 징후가 의심됩니다. 지금은 119 또는 112 연락과 응급실 방문이 우선입니다.',
    ['응급 증상이 의심됨'],
    '본 정보는 의료 진단 또는 처방을 대체하지 않습니다. 응급 상황에서는 즉시 119, 112 또는 응급실을 이용하세요.',
  );
}

function buildSystemPrompt(isProMode: boolean, language: string): string {
  return `당신은 '메디-큐레이터' AI 건강 정보 도우미입니다. 한국 식약처(MFDS) 공개 정보 기반.
[출력 원칙]
1. Google 검색의 건강 정보 카드처럼 일반 건강정보를 명확하고 실용적으로 제공합니다.
2. 진단·처방처럼 단정하지 말고, "가능성", "일반적으로", "확인해 볼 수 있는 선택지" 톤을 사용합니다.
3. 의약품은 추천하지 않습니다. 처방의약품은 물론 일반의약품(OTC)도 마찬가지이며, 특정 약품명이나 용량 지시를 aiAdvice 에 넣지 마세요. 약 선택은 "약사와 상담"으로 안내합니다.
4. 생활관리·휴식·예상 경과 같은 일반 정보는 별도 항목이 아니라 aiAdvice 안에 자연스럽게 녹여 씁니다.
5. 응급/자살 의심 시 109, 1577-0199, 119, 112 안내.
6. disclaimer는 짧고 자연스럽게 포함합니다.

[모드] ${isProMode ? '프로(EBM 심층)' : '일반(평이한 언어)'}
[언어] ${LANGUAGE_NAMES[language] ?? '한국어'}
[형식] 아래 JSON 스키마만, 외부 텍스트 절대 금지.

{
  "recommendedDepartment": "string",
  "aiAdvice": "string",
  "redFlags": [],
  "disclaimer": "일반 건강정보입니다. 증상이 심하거나 오래가면 의사·약사와 상담하세요."
}`;
}

export const curate = onRequest(
  {
    cors: false, // 호스팅 동일 출처(/api/curate)로만 호출
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 30,
    memory: '512MiB',
    invoker: 'public',
  },
  async (req, res) => {
    // 1) Method
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, code: 'METHOD', message: 'POST only' });
      return;
    }

    // 2) Validate input
    const parsed = CurateRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: parsed.error.message });
      return;
    }
    const q = parsed.data;

    const appCheckResult = await requireAppCheck(req);
    if (!appCheckResult.ok) {
      res.status(appCheckResult.status).json({
        ok: false,
        code: appCheckResult.code,
        message: appCheckResult.message,
      });
      return;
    }

    const caller = await requireAuthenticatedConsent(req);
    if (!caller.ok) {
      res.status(caller.status).json({ ok: false, code: caller.code, message: caller.message });
      return;
    }

    // 3) Central rate limit
    let rateAllowed: boolean;
    try {
      rateAllowed = await enforceCentralRateLimit(db, caller.uid);
    } catch (error) {
      logger.error('curate.rate_limit_error', { uid: caller.uid, err: (error as Error).message });
      res.status(503).json({
        ok: false,
        code: 'RATE_LIMIT_UNAVAILABLE',
        message: USAGE_LIMIT_MESSAGES.unavailable,
      });
      return;
    }
    if (!rateAllowed) {
      res.status(429).json({ ok: false, code: 'RATE_LIMIT', message: USAGE_LIMIT_MESSAGES.exceeded });
      return;
    }

    const emergencyKind = detectEmergency(q.symptoms);
    if (emergencyKind) {
      res.status(200).json({ ok: true, data: emergencyResult(emergencyKind), cached: false });
      return;
    }

    // 4) Build prompt + call Gemini
    const sys = buildSystemPrompt(q.isProMode, q.language);
    const user = `[증상] ${q.symptoms}\n[복용약] ${q.currentMedications || '없음'}${
      q.age ? `\n[연령] ${q.age}` : ''
    }\n위 정보를 JSON 으로 제공.`;
    const traceId = newTraceId();
    logger.info('curate.start', { traceId, uid: caller.uid, lang: q.language, pro: q.isProMode });

    try {
      const models = modelCandidates(q.isProMode);
      let llm: Response | null = null;

      for (const [index, modelName] of models.entries()) {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 20_000);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY.value()}`;

        try {
          llm = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${sys}\n\n${user}` }] }],
              // responseMimeType asks Gemini to emit a bare JSON object (no prose,
              // no markdown fence), so the regex extraction below is only a fallback
              // for older models that ignore it — preventing NO_JSON/PARSE 502s.
              generationConfig: { temperature: 0.3, maxOutputTokens: 4096, responseMimeType: 'application/json' },
            }),
            signal: ctl.signal,
          });
        } finally {
          clearTimeout(to);
        }

        if (!worthRetrying(llm.status) || index === models.length - 1) break;
        logger.warn('curate.model_fallback', { traceId, from: modelName, to: models[index + 1] });
      }

      if (!llm) throw new Error('Gemini request was not attempted');

      if (!llm.ok) {
        const txt = await llm.text().catch(() => '');
        logger.warn('curate.upstream_error', { traceId, status: llm.status, body: txt.slice(0, 200) });
        res.status(502).json({ ok: false, code: 'LLM_ERROR', message: `upstream ${llm.status}` });
        return;
      }

      const body = (await llm.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        res.status(502).json({ ok: false, code: 'NO_JSON', message: 'LLM 응답 형식 오류' });
        return;
      }

      let candidate: unknown;
      try {
        candidate = JSON.parse(match[0]);
      } catch (e) {
        res.status(502).json({ ok: false, code: 'PARSE', message: (e as Error).message });
        return;
      }

      const validated = CurationResult.safeParse(candidate);
      if (!validated.success) {
        logger.warn('curate.schema_fail', { traceId, issues: validated.error.issues.slice(0, 3) });
        res.status(502).json({ ok: false, code: 'SCHEMA', message: validated.error.message });
        return;
      }

      const forbidden = violatesForbidden(JSON.stringify(validated.data));
      if (forbidden) {
        logger.warn('curate.forbidden', { traceId, phrase: forbidden });
        res.status(422).json({ ok: false, code: 'FORBIDDEN', message: `금지 표현 감지: ${forbidden}` });
        return;
      }

      logger.info('curate.ok', { traceId });
      res.status(200).json({
        ok: true,
        cached: false,
        data: safeResult(
          validated.data.recommendedDepartment,
          validated.data.aiAdvice,
          validated.data.redFlags,
          validated.data.disclaimer,
        ),
      });
    } catch (e) {
      logger.error('curate.exception', { traceId, err: (e as Error).message });
      res.status(500).json({ ok: false, code: 'EXCEPTION', message: (e as Error).message });
    }
  },
);

// DSR (정보주체 요구권) — 분리된 모듈에서 export
export { dsr } from './dsr';
export { pharmacies } from './pharmacies';
// AI 보조 엔드포인트 — 자유 입력을 AI 로 판단 (상호작용/영양제 궁합/사진 인식)
export { interaction, pairing, recognizeMed } from './aiTools';

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

// === 글로벌 옵션 (한국 사용자 지연 최소화) ===
setGlobalOptions({ region: 'asia-northeast3', maxInstances: 10 });
if (!admin.apps.length) admin.initializeApp();
const auth = admin.auth();
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

const CurationResult = z.object({
  recommendedDepartment: z.string().min(1).max(100),
  aiAdvice: z.string().min(1).max(2000),
  otcMedications: z.array(OTCMedication).max(10),
  folkRemedies: z.array(z.string().max(300)).max(10),
  lifestyleTips: z.array(z.string().max(300)).max(15),
  exercisePrescription: ExercisePlan,
  recoveryTimeline: z.array(RecoveryTimeline).max(6),
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

// === 금지어 가드 (forbidden-phrases.txt 의 핵심 부분집합) ===
const FORBIDDEN: RegExp[] = [
  /진단(됩니다|입니다|이[다라])/,
  /처방(해드립니다|입니다|이[다라])/,
  /완치(됩니다|보장)/,
  /부작용 없[음이다는]/,
  /100% 효과/,
];
function violatesForbidden(text: string): string | null {
  for (const re of FORBIDDEN) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

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

// MUST stay in sync with src/schemas/consent.ts CONSENT_VERSION. The client and
// functions packages cannot share an import, so a policy-version bump requires
// editing this constant, the client schema, and the firestore.rules path together.
const CONSENT_VERSION = '2026-06-01';

async function requireAuthenticatedConsent(req: { headers: Record<string, unknown> }) {
  const authz = String(req.headers.authorization ?? '');
  const m = /^Bearer (.+)$/.exec(authz);
  if (!m) return { ok: false as const, status: 401, code: 'NO_TOKEN', message: '인증이 필요합니다' };
  try {
    const decoded = await auth.verifyIdToken(m[1]);
    const snap = await db.collection('users').doc(decoded.uid).collection('consents').doc(CONSENT_VERSION).get();
    const data = snap.data();
    if (!snap.exists || !data?.items?.sensitiveHealth || data?.isAdult !== true) {
      return { ok: false as const, status: 403, code: 'CONSENT_REQUIRED', message: '동의가 필요합니다' };
    }
    return { ok: true as const, uid: decoded.uid };
  } catch {
    return { ok: false as const, status: 401, code: 'BAD_TOKEN', message: '인증 확인에 실패했습니다' };
  }
}

async function requireAppCheck(req: { headers: Record<string, unknown> }) {
  const token = String(req.headers['x-firebase-appcheck'] ?? '');
  if (!token) {
    return { ok: false as const, status: 401, code: 'APP_CHECK_REQUIRED', message: '앱 무결성 확인이 필요합니다' };
  }
  try {
    await admin.appCheck().verifyToken(token);
    return { ok: true as const };
  } catch {
    return { ok: false as const, status: 401, code: 'APP_CHECK_REQUIRED', message: '앱 무결성 확인에 실패했습니다' };
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어', en: 'English', zh: '中文(简体)', ja: '日本語', es: 'Español',
};

function buildSystemPrompt(isProMode: boolean, language: string): string {
  return `당신은 '메디-큐레이터' AI 건강 정보 도우미입니다. 한국 식약처(MFDS) 공개 정보 기반.
[절대 금지]
1. 의료 진단·처방 단정 어휘 사용 금지 (예: "진단됩니다", "처방해드립니다").
2. 처방의약품 추천 금지. 약품명, 용량, 상호작용, 민간요법, 운동처방, 회복기간은 출력하지 마십시오.
3. disclaimer 필수 포함.
4. 응급/자살 의심 시 109, 1577-0199, 119, 112 안내.
5. 개인 의료정보 수집하지 않음을 명시.

[모드] ${isProMode ? '프로(EBM 심층)' : '일반(평이한 언어)'}
[언어] ${LANGUAGE_NAMES[language] ?? '한국어'}
[형식] 아래 JSON 스키마만, 외부 텍스트 절대 금지.

{
  "recommendedDepartment": "string",
  "aiAdvice": "string",
  "otcMedications": [],
  "folkRemedies": [],
  "lifestyleTips": [],
  "exercisePrescription": {"recommended":[],"avoid":[],"duration":""},
  "recoveryTimeline": [],
  "redFlags": [],
  "disclaimer": "본 정보는 의료 진단 또는 처방을 대체하지 않습니다."
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
        message: '요청 한도를 확인할 수 없습니다',
      });
      return;
    }
    if (!rateAllowed) {
      res.status(429).json({ ok: false, code: 'RATE_LIMIT', message: '시간당 요청 한도를 초과했습니다' });
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
    const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

        if (llm.status !== 429 || index === models.length - 1) break;
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

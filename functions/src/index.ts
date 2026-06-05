// medi-curator Cloud Function v2 — Gemini 프록시
// 배포: firebase deploy --only functions
// 시크릿 설정: firebase functions:secrets:set GEMINI_API_KEY
// 호스팅 리라이트: firebase.json 의 /api/curate → functions/curate

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import { z } from 'zod';

// === 글로벌 옵션 (한국 사용자 지연 최소화) ===
setGlobalOptions({ region: 'asia-northeast3', maxInstances: 10 });

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

// === 인메모리 레이트리밋 (인스턴스 단위, maxInstances=10 고려해 LIMIT 분배) ===
const RATE = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;
function allow(ip: string): boolean {
  const now = Date.now();
  const e = RATE.get(ip);
  if (!e || e.resetAt < now) {
    RATE.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (e.count >= LIMIT) return false;
  e.count++;
  return true;
}

const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어', en: 'English', zh: '中文(简体)', ja: '日本語', es: 'Español',
};

function buildSystemPrompt(isProMode: boolean, language: string): string {
  return `당신은 '메디-큐레이터' AI 건강 정보 도우미입니다. 한국 식약처(MFDS) 공개 정보 기반.
[절대 금지]
1. 의료 진단·처방 단정 어휘 사용 금지 (예: "진단됩니다", "처방해드립니다").
2. 처방의약품 추천 금지. OTC 일반의약품만.
3. disclaimer 필수 포함.
4. 응급/자살 의심 시 119, 1393, 1577-0199 모두 안내.
5. 개인 의료정보 수집하지 않음을 명시.

[모드] ${isProMode ? '프로(EBM 심층)' : '일반(평이한 언어)'}
[언어] ${LANGUAGE_NAMES[language] ?? '한국어'}
[형식] 아래 JSON 스키마만, 외부 텍스트 절대 금지.

{
  "recommendedDepartment": "string",
  "aiAdvice": "string",
  "otcMedications": [{"name":"","purpose":"","dosage":"","warnings":[],"interactions":[],"riskLevel":"low|medium|high"}],
  "folkRemedies": [],
  "lifestyleTips": [],
  "exercisePrescription": {"recommended":[],"avoid":[],"duration":""},
  "recoveryTimeline": [{"ageGroup":"","expectedDays":"","notes":""}],
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

    // 2) Rate limit
    const fwd = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
    const ip = fwd.split(',')[0]?.trim() || (req.ip ?? 'unknown');
    if (!allow(ip)) {
      res.status(429).json({ ok: false, code: 'RATE_LIMIT', message: '요청이 너무 많습니다' });
      return;
    }

    // 3) Validate input
    const parsed = CurateRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: parsed.error.message });
      return;
    }
    const q = parsed.data;

    // 4) Build prompt + call Gemini
    const sys = buildSystemPrompt(q.isProMode, q.language);
    const user = `[증상] ${q.symptoms}\n[복용약] ${q.currentMedications || '없음'}${
      q.age ? `\n[연령] ${q.age}` : ''
    }\n위 정보를 JSON 으로 제공.`;
    const modelName = q.isProMode ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY.value()}`;

    const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    logger.info('curate.start', { traceId, ip, lang: q.language, pro: q.isProMode });

    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 20_000);

      const llm = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${sys}\n\n${user}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
        signal: ctl.signal,
      });
      clearTimeout(to);

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
      res.status(200).json({ ok: true, data: validated.data, cached: false });
    } catch (e) {
      logger.error('curate.exception', { traceId, err: (e as Error).message });
      res.status(500).json({ ok: false, code: 'EXCEPTION', message: (e as Error).message });
    }
  },
);

// DSR (정보주체 요구권) — 분리된 모듈에서 export
export { dsr } from './dsr';

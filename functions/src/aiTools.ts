// medi-curator Cloud Functions v2 — AI 보조 엔드포인트 (interaction / pairing)
// curate 와 동일한 보안 스택(App Check + 인증 동의 + 레이트리밋 + 금지어 가드 +
// Zod 검증)을 shared.ts 를 통해 재사용한다. 두 엔드포인트 모두 "미리 정의된 목록"이
// 아니라 자유 입력 내용을 Gemini 로 판단한다.
//
// ⚠️ 의료/법무 검토 대상: 상호작용 판단 출력은 RT-005(개인화된 의료 판단 회피)를
// 준수해야 하므로, 절대 "위험/복용 중단" 같은 단정 지시를 내리지 않고 "약사와 확인할
// 항목"만 비판단적으로 제시한다. 프롬프트 변경 시 medical-reviewer + legal-advisor
// 승인이 필요하다 (AGENTS.md).

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { enforceCentralRateLimit } from './rateLimit';
import {
  LANGUAGE_NAMES,
  callGemini,
  newTraceId,
  requireAppCheck,
  requireAuthenticatedConsent,
  violatesForbidden,
} from './shared';

if (!admin.apps.length) admin.initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const Language = z.enum(['ko', 'en', 'zh', 'ja', 'es']);

// ──────────────────────────────────────────────────────────────────────────
// 상호작용 점검 (interaction)
// ──────────────────────────────────────────────────────────────────────────

const InteractionRequest = z.object({
  query: z.string().min(1).max(2048),
  current: z.string().min(1).max(2048),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
});

// 비판단적 결과 — severity 는 info/caution 만(danger/금지 없음, RT-005).
const InteractionTopic = z.object({
  pair: z.string().min(1).max(200),
  topic: z.string().min(1).max(500),
  severity: z.enum(['info', 'caution']),
});
const InteractionAIResult = z.object({
  topics: z.array(InteractionTopic).max(12),
  generalNote: z.string().max(800),
  disclaimer: z.string().min(10).max(1000),
});

function interactionSystemPrompt(isProMode: boolean, language: string): string {
  return `당신은 '메디-큐레이터'의 약물·보충제 상호작용 정보 도우미입니다. 한국 식약처(MFDS)/공개 약학 정보 기반.
[역할] 사용자가 '새로 시작하려는 항목'과 '현재 복용 중인 항목'을 입력하면, 함께 복용 시 약사·의사와 확인하면 좋은 '주제'를 비판단적으로 안내합니다.
[절대 금지]
1. 진단·처방·복용 중단 지시 금지. "위험합니다", "드시면 안 됩니다", "진단됩니다", "처방" 같은 단정 어휘 금지.
2. 특정 용량 지시 금지.
3. severity 는 'info' 또는 'caution' 만 사용. 'danger' 등 공포 유발 표현 금지.
4. 각 주제는 "~를 약사와 확인해 보세요" 형태의 확인 권유로 표현.
5. disclaimer 필수.
[모드] ${isProMode ? '프로(근거 중심, 기전 간단 언급 허용)' : '일반(평이한 언어)'}
[언어] ${LANGUAGE_NAMES[language] ?? '한국어'} 로 모든 문자열 작성.
[형식] 아래 JSON 스키마만 출력, 외부 텍스트·마크다운 금지.
{
  "topics": [{ "pair": "관련 항목 쌍(예: 비타민 K + 와파린)", "topic": "약사와 확인할 내용", "severity": "info|caution" }],
  "generalNote": "전반적 안내(없으면 빈 문자열)",
  "disclaimer": "본 정보는 의료 진단 또는 처방을 대체하지 않습니다."
}
입력에 알려진 상호작용 근거가 없으면 topics 를 빈 배열로 두고 generalNote 로 안내하세요.`;
}

export const interaction = onRequest(
  { cors: false, secrets: [GEMINI_API_KEY], timeoutSeconds: 30, memory: '512MiB', invoker: 'public', region: 'asia-northeast3' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, code: 'METHOD', message: 'POST only' });
      return;
    }
    const parsed = InteractionRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: parsed.error.message });
      return;
    }
    const q = parsed.data;

    const appCheck = await requireAppCheck(req);
    if (!appCheck.ok) {
      res.status(appCheck.status).json({ ok: false, code: appCheck.code, message: appCheck.message });
      return;
    }
    const caller = await requireAuthenticatedConsent(req);
    if (!caller.ok) {
      res.status(caller.status).json({ ok: false, code: caller.code, message: caller.message });
      return;
    }

    let rateAllowed: boolean;
    try {
      rateAllowed = await enforceCentralRateLimit(admin.firestore(), caller.uid);
    } catch (error) {
      logger.error('interaction.rate_limit_error', { uid: caller.uid, err: (error as Error).message });
      res.status(503).json({ ok: false, code: 'RATE_LIMIT_UNAVAILABLE', message: '요청 한도를 확인할 수 없습니다' });
      return;
    }
    if (!rateAllowed) {
      res.status(429).json({ ok: false, code: 'RATE_LIMIT', message: '시간당 요청 한도를 초과했습니다' });
      return;
    }

    const traceId = newTraceId();
    const sys = interactionSystemPrompt(q.isProMode, q.language);
    const user = `[새로 시작/문의 항목] ${q.query}\n[현재 복용 항목] ${q.current}\n위 정보를 JSON 으로 제공.`;
    logger.info('interaction.start', { traceId, uid: caller.uid, lang: q.language });

    const outcome = await callGemini({ apiKey: GEMINI_API_KEY.value(), isProMode: q.isProMode, sys, user, traceId });
    if (!outcome.ok) {
      res.status(outcome.status).json({ ok: false, code: outcome.code, message: outcome.message });
      return;
    }
    const validated = InteractionAIResult.safeParse(outcome.candidate);
    if (!validated.success) {
      logger.warn('interaction.schema_fail', { traceId, issues: validated.error.issues.slice(0, 3) });
      res.status(502).json({ ok: false, code: 'SCHEMA', message: validated.error.message });
      return;
    }
    const forbidden = violatesForbidden(JSON.stringify(validated.data));
    if (forbidden) {
      logger.warn('interaction.forbidden', { traceId, phrase: forbidden });
      res.status(422).json({ ok: false, code: 'FORBIDDEN', message: `금지 표현 감지: ${forbidden}` });
      return;
    }
    logger.info('interaction.ok', { traceId });
    res.status(200).json({ ok: true, cached: false, data: validated.data });
  },
);

// ──────────────────────────────────────────────────────────────────────────
// 비타민/보충제 페어링 (pairing)
// ──────────────────────────────────────────────────────────────────────────

const PairingRequest = z.object({
  goal: z.string().min(1).max(500),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
});

const PairingItem = z.object({
  name: z.string().min(1).max(120),
  why: z.string().min(1).max(300),
});
const PairingAIResult = z.object({
  goalLabel: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  items: z.array(PairingItem).min(1).max(8),
  tip: z.string().max(400),
  disclaimer: z.string().min(10).max(1000),
});

function pairingSystemPrompt(isProMode: boolean, language: string): string {
  return `당신은 '메디-큐레이터'의 영양제 궁합 정보 도우미입니다. 일반적 영양 정보 기반.
[역할] 사용자가 건강 목표(예: 눈 피로, 집중력, 면역)를 입력하면, 함께 섭취하면 좋은 비타민·보충제 조합을 안내합니다.
[절대 금지]
1. 진단·처방·치료 단정 어휘 금지. 처방의약품 추천 금지(일반 영양제·비타민만).
2. 특정 질병 치료 효능 단정 금지. "도움을 줄 수 있어요" 수준의 일반적 표현 사용.
3. disclaimer 필수.
[모드] ${isProMode ? '프로(근거·기전 간단 언급 허용)' : '일반(평이한 언어)'}
[언어] ${LANGUAGE_NAMES[language] ?? '한국어'} 로 모든 문자열 작성.
[형식] 아래 JSON 스키마만 출력, 외부 텍스트·마크다운 금지.
{
  "goalLabel": "입력 목표를 다듬은 짧은 라벨",
  "summary": "이 조합이 목표에 어떻게 도움되는지 한두 문장",
  "items": [{ "name": "영양제/비타민 이름", "why": "왜 좋은지 한 문장" }],
  "tip": "복용 팁(없으면 빈 문자열)",
  "disclaimer": "일반적인 영양 정보이며 의학적 조언이 아닙니다."
}`;
}

export const pairing = onRequest(
  { cors: false, secrets: [GEMINI_API_KEY], timeoutSeconds: 30, memory: '512MiB', invoker: 'public', region: 'asia-northeast3' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, code: 'METHOD', message: 'POST only' });
      return;
    }
    const parsed = PairingRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: parsed.error.message });
      return;
    }
    const q = parsed.data;

    const appCheck = await requireAppCheck(req);
    if (!appCheck.ok) {
      res.status(appCheck.status).json({ ok: false, code: appCheck.code, message: appCheck.message });
      return;
    }
    const caller = await requireAuthenticatedConsent(req);
    if (!caller.ok) {
      res.status(caller.status).json({ ok: false, code: caller.code, message: caller.message });
      return;
    }

    let rateAllowed: boolean;
    try {
      rateAllowed = await enforceCentralRateLimit(admin.firestore(), caller.uid);
    } catch (error) {
      logger.error('pairing.rate_limit_error', { uid: caller.uid, err: (error as Error).message });
      res.status(503).json({ ok: false, code: 'RATE_LIMIT_UNAVAILABLE', message: '요청 한도를 확인할 수 없습니다' });
      return;
    }
    if (!rateAllowed) {
      res.status(429).json({ ok: false, code: 'RATE_LIMIT', message: '시간당 요청 한도를 초과했습니다' });
      return;
    }

    const traceId = newTraceId();
    const sys = pairingSystemPrompt(q.isProMode, q.language);
    const user = `[건강 목표] ${q.goal}\n위 목표에 맞는 영양제 궁합을 JSON 으로 제공.`;
    logger.info('pairing.start', { traceId, uid: caller.uid, lang: q.language });

    const outcome = await callGemini({ apiKey: GEMINI_API_KEY.value(), isProMode: q.isProMode, sys, user, traceId });
    if (!outcome.ok) {
      res.status(outcome.status).json({ ok: false, code: outcome.code, message: outcome.message });
      return;
    }
    const validated = PairingAIResult.safeParse(outcome.candidate);
    if (!validated.success) {
      logger.warn('pairing.schema_fail', { traceId, issues: validated.error.issues.slice(0, 3) });
      res.status(502).json({ ok: false, code: 'SCHEMA', message: validated.error.message });
      return;
    }
    const forbidden = violatesForbidden(JSON.stringify(validated.data));
    if (forbidden) {
      logger.warn('pairing.forbidden', { traceId, phrase: forbidden });
      res.status(422).json({ ok: false, code: 'FORBIDDEN', message: `금지 표현 감지: ${forbidden}` });
      return;
    }
    logger.info('pairing.ok', { traceId });
    res.status(200).json({ ok: true, cached: false, data: validated.data });
  },
);

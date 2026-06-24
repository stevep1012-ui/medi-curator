// Shared guard + LLM helpers used by every AI proxy endpoint (curate, interaction,
// pairing). Centralising these keeps the medical-safety invariants — App Check,
// authenticated consent, the forbidden-phrase guard — in ONE place so a fix or a
// policy bump can't silently diverge between endpoints (AGENTS.md R-001/R-008).

import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { modelCandidates } from './modelSelection';

// MUST stay in sync with src/schemas/consent.ts CONSENT_VERSION. The client and
// functions packages cannot share an import, so a policy-version bump requires
// editing this constant, the client schema, and the firestore.rules path together.
export const CONSENT_VERSION = '2026-06-01';

export const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어', en: 'English', zh: '中文(简体)', ja: '日本語', es: 'Español',
};

// === 금지어 가드 (forbidden-phrases.txt 의 핵심 부분집합) ===
// 의료법 §27 — reject diagnosis/prescription/cure claims. Mirror of the client
// guard in src/schemas/curation.ts.
const FORBIDDEN: RegExp[] = [
  /진단(됩니다|입니다|이[다라])/,
  /처방(해드립니다|입니다|이[다라])/,
  /완치(됩니다|보장)/,
  /부작용 없[음이다는]/,
  /100% 효과/,
];

export function violatesForbidden(text: string): string | null {
  for (const re of FORBIDDEN) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

type HeaderBag = { headers: Record<string, unknown> };
type GuardResult =
  | { ok: true }
  | { ok: false; status: number; code: string; message: string };

// App Check — best-effort(완화 모드). reCAPTCHA 사이트키가 설정되기 전까지
// 토큰이 없거나 유효하지 않아도 차단하지 않는다(토큰이 있으면 검증만 시도).
// 이 함수를 쓰는 AI 엔드포인트는 뒤에 requireAuthenticatedConsent(로그인+동의)
// 게이트가 남아 있어 익명 남용은 여전히 차단된다. 사이트키 설정 후 hard 모드로
// 되돌리려면 토큰 부재/검증실패 시 401을 반환하도록 복구하면 된다.
export async function requireAppCheck(req: HeaderBag): Promise<GuardResult> {
  const token = String(req.headers['x-firebase-appcheck'] ?? '');
  const strict = process.env.APP_CHECK_MODE === 'strict';
  if (!token && strict) {
    return { ok: false, status: 401, code: 'APP_CHECK_REQUIRED', message: '앱 무결성 확인이 필요합니다' };
  }
  if (token) {
    try {
      await admin.appCheck().verifyToken(token);
    } catch {
      if (strict) {
        return { ok: false, status: 401, code: 'APP_CHECK_REQUIRED', message: '앱 무결성 확인에 실패했습니다' };
      }
      /* soft-fail: 사이트키 미설정 환경에서도 동작하도록 통과 */
    }
  }
  return { ok: true as const };
}

export async function requireAuthenticatedConsent(req: HeaderBag) {
  const auth = admin.auth();
  const db = admin.firestore();
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

export type GeminiOutcome =
  | { ok: true; candidate: unknown }
  | { ok: false; status: number; code: string; message: string };

// Runs the model-fallback fetch loop against Gemini and extracts the first JSON
// object from the response. Callers own schema validation + the forbidden guard;
// this only handles transport, model fallback, and JSON extraction so the policy
// logic stays at the call site where the per-endpoint schema lives.
export async function callGemini(opts: {
  apiKey: string;
  isProMode: boolean;
  sys: string;
  user: string;
  traceId: string;
  // Optional inline image for multimodal (vision) prompts. The image is sent to the
  // model for inference only — never stored or logged server-side.
  image?: { mimeType: string; dataBase64: string };
}): Promise<GeminiOutcome> {
  const { apiKey, isProMode, sys, user, traceId, image } = opts;
  const models = modelCandidates(isProMode);
  let llm: Response | null = null;

  const parts: Array<Record<string, unknown>> = [{ text: `${sys}\n\n${user}` }];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.dataBase64 } });

  for (const [index, modelName] of models.entries()) {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 20_000);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      llm = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096, responseMimeType: 'application/json' },
        }),
        signal: ctl.signal,
      });
    } finally {
      clearTimeout(to);
    }
    if (llm.status !== 429 || index === models.length - 1) break;
    logger.warn('llm.model_fallback', { traceId, from: modelName, to: models[index + 1] });
  }

  if (!llm) return { ok: false, status: 502, code: 'LLM_ERROR', message: 'Gemini request was not attempted' };

  if (!llm.ok) {
    const txt = await llm.text().catch(() => '');
    logger.warn('llm.upstream_error', { traceId, status: llm.status, body: txt.slice(0, 200) });
    return { ok: false, status: 502, code: 'LLM_ERROR', message: `upstream ${llm.status}` };
  }

  const body = (await llm.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { ok: false, status: 502, code: 'NO_JSON', message: 'LLM 응답 형식 오류' };

  try {
    return { ok: true, candidate: JSON.parse(match[0]) };
  } catch (e) {
    return { ok: false, status: 502, code: 'PARSE', message: (e as Error).message };
  }
}

export function newTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Curation client — calls the server-side LLM proxy (/api/curate), validates the
// response against the client Zod schema (AGENTS.md R-008: never show unvalidated
// output), and maps transport/auth errors to user-friendly Korean messages so the
// UI never white-screens. The Gemini API key never touches the browser (R-001).
import { z } from 'zod';
import { CurationResult as CurationResultSchema, SymptomQuery } from '../schemas/curation';
import type { CurationResult } from '../types';
import { getAppCheckToken, getIdToken } from '../firebase';

// In-memory cache: identical queries within a session reuse the result and make
// no further network calls. Bounded with insertion-order (LRU-ish) eviction and a
// short TTL, so a long session can't grow the map without limit and a stale answer
// can't outlive a mid-session model/policy change.
const CACHE_MAX = 50;
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const cache = new Map<string, { result: CurationResult; at: number }>();

function cacheKey(symptoms: string, meds: string, isProMode: boolean, language: string): string {
  return JSON.stringify([symptoms, meds, isProMode, language]);
}

interface CurateError {
  ok: false;
  code?: string;
  message?: string;
}

function mapError(status: number, body: CurateError | null): Error {
  const code = body?.code;
  if (code === 'APP_CHECK_REQUIRED') {
    return new Error('브라우저 보안 확인이 완료되지 않았습니다. 새로고침 후 다시 시도해 주세요.');
  }
  if (code === 'NO_TOKEN' || code === 'BAD_TOKEN') {
    return new Error('로그인이 필요합니다.');
  }
  if (code === 'CONSENT_REQUIRED') {
    return new Error('민감정보 동의가 필요합니다.');
  }
  if (code === 'RATE_LIMIT') {
    return new Error('무료 사용 한도를 초과했습니다. 다음 달에 다시 이용하거나 Plus를 확인해 주세요.');
  }
  if (code === 'FORBIDDEN') {
    return new Error(body?.message || '금지 표현이 감지되어 결과를 표시할 수 없습니다.');
  }
  return new Error(body?.message || `요청에 실패했습니다 (${status}).`);
}

export async function getCurationFromGemini(
  symptoms: string,
  currentMedications: string,
  isProMode: boolean,
  language: string,
): Promise<CurationResult> {
  const key = cacheKey(symptoms, currentMedications, isProMode, language);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    // cache-first: refresh recency for LRU eviction, no network call on repeats
    cache.delete(key);
    cache.set(key, cached);
    return cached.result;
  }
  if (cached) cache.delete(key); // expired entry

  const parsedInput = SymptomQuery.safeParse({ symptoms, currentMedications, isProMode, language });
  if (!parsedInput.success) {
    throw new Error('증상을 조금 더 자세히 입력해 주세요.');
  }

  // Best-effort integrity + identity headers. The server enforces them; if a
  // token is unavailable the server returns the mapped 401/403, which we surface.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const appCheck = await getAppCheckToken();
  if (appCheck) headers['X-Firebase-AppCheck'] = appCheck;
  const idToken = await getIdToken();
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  let res: Response;
  try {
    res = await fetch('/api/curate', {
      method: 'POST',
      headers,
      body: JSON.stringify(parsedInput.data),
    });
  } catch {
    throw new Error('네트워크 연결을 확인해 주세요.');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  const envelope = body as { ok?: boolean; data?: unknown } & CurateError;
  if (!res.ok || !envelope?.ok) {
    throw mapError(res.status, envelope);
  }

  const validated = CurationResultSchema.safeParse(envelope.data);
  if (!validated.success) {
    throw new Error('결과를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }

  const result = validated.data as z.infer<typeof CurationResultSchema>;
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value; // Map preserves insertion order
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { result, at: Date.now() });
  return result;
}

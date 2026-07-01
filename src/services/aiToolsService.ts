// AI-assisted tool clients — call the server-side LLM proxies (/api/interaction,
// /api/pairing), validate responses against the client Zod schemas (R-008), and
// map transport/auth errors to user-friendly Korean messages so the UI never
// white-screens. The Gemini API key never touches the browser (R-001).
import {
  InteractionAIResult,
  InteractionQuery,
  PairingAIResult,
  PairingQuery,
  RecognizeQuery,
  RecognizedMed,
  type InteractionAIResultT,
  type PairingAIResultT,
  type RecognizedMedT,
} from '../schemas/aiTools';
import { getAppCheckToken, getIdToken } from '../firebase';

interface ProxyError {
  ok: false;
  code?: string;
  message?: string;
}

function mapError(status: number, body: ProxyError | null): Error {
  const code = body?.code;
  if (code === 'APP_CHECK_REQUIRED') return new Error('브라우저 보안 확인이 완료되지 않았습니다. 새로고침 후 다시 시도해 주세요.');
  if (code === 'NO_TOKEN' || code === 'BAD_TOKEN') return new Error('로그인이 필요합니다.');
  if (code === 'CONSENT_REQUIRED') return new Error('민감정보 동의가 필요합니다.');
  if (code === 'RATE_LIMIT') return new Error('시간당 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.');
  if (code === 'FORBIDDEN') return new Error(body?.message || '표현 문제로 결과를 표시할 수 없습니다.');
  return new Error(body?.message || `요청에 실패했습니다 (${status}).`);
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const appCheck = await getAppCheckToken();
  if (appCheck) headers['X-Firebase-AppCheck'] = appCheck;
  const idToken = await getIdToken();
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  return headers;
}

// Small bounded session cache shared by both tools (keyed by endpoint + input).
const CACHE_MAX = 50;
const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, { data: unknown; at: number }>();

function readCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    cache.delete(key);
    cache.set(key, hit);
    return hit.data as T;
  }
  if (hit) cache.delete(key);
  return null;
}

function writeCache(key: string, data: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, at: Date.now() });
}

async function postProxy(path: string, payload: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(payload) });
  } catch {
    throw new Error('네트워크 연결을 확인해 주세요.');
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const envelope = body as { ok?: boolean; data?: unknown } & ProxyError;
  if (!res.ok || !envelope?.ok) throw mapError(res.status, envelope);
  return envelope.data;
}

export async function getInteractionFromAI(
  query: string,
  current: string,
  isProMode: boolean,
  language: string,
): Promise<InteractionAIResultT> {
  const parsed = InteractionQuery.safeParse({ query, current, isProMode, language });
  if (!parsed.success) throw new Error('점검할 항목을 조금 더 자세히 입력해 주세요.');
  const key = `interaction:${JSON.stringify(parsed.data)}`;
  const cached = readCache<InteractionAIResultT>(key);
  if (cached) return cached;

  const data = await postProxy('/api/interaction', parsed.data);
  const validated = InteractionAIResult.safeParse(data);
  if (!validated.success) throw new Error('결과를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  writeCache(key, validated.data);
  return validated.data;
}

export async function getPairingFromAI(
  goal: string,
  isProMode: boolean,
  language: string,
): Promise<PairingAIResultT> {
  const parsed = PairingQuery.safeParse({ goal, isProMode, language });
  if (!parsed.success) throw new Error('목표를 조금 더 자세히 입력해 주세요.');
  const key = `pairing:${JSON.stringify(parsed.data)}`;
  const cached = readCache<PairingAIResultT>(key);
  if (cached) return cached;

  const data = await postProxy('/api/pairing', parsed.data);
  const validated = PairingAIResult.safeParse(data);
  if (!validated.success) throw new Error('결과를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  writeCache(key, validated.data);
  return validated.data;
}

// 사진 인식 — 이미지는 서버 추론에만 쓰이고 저장되지 않는다. 캐시도 두지 않음(매 이미지 고유).
export async function getMedFromImageAI(
  imageBase64: string,
  mimeType: string,
  language: string,
): Promise<RecognizedMedT> {
  const parsed = RecognizeQuery.safeParse({ imageBase64, mimeType, language, isProMode: false });
  if (!parsed.success) throw new Error('이미지를 인식할 수 없습니다. 더 선명한 사진으로 다시 시도해 주세요.');
  const data = await postProxy('/api/recognize-med', parsed.data);
  const validated = RecognizedMed.safeParse(data);
  if (!validated.success) throw new Error('결과를 표시할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  return validated.data;
}

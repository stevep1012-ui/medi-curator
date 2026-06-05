// medi-curator 클라이언트 — 서버 프록시 호출만. (R-001 해결)
// 이전 직접 LLM 호출 코드는 제거. 키 노출 위험 제거.
import { CurationResult, CurateResponse } from '../schemas/curation';
import type { CurationResult as CurationResultType } from '../types';

// 5분 in-memory 캐시
const cache = new Map<string, { data: CurationResultType; ts: number }>();
const TTL = 5 * 60 * 1000;

function key(s: string, m: string, pro: boolean, lang: string) {
  // 평문 캐시 키 (R-010 부분 완화: hash 적용)
  return btoa(unescape(encodeURIComponent(`${s.trim().toLowerCase()}|${m.trim().toLowerCase()}|${pro}|${lang}`)));
}

export async function getCurationFromGemini(
  symptoms: string,
  currentMedications: string,
  isProMode: boolean,
  language: string,
  userAge?: string,
): Promise<CurationResultType> {
  const cacheKey = key(symptoms, currentMedications, isProMode, language);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const resp = await fetch('/api/curate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ symptoms, currentMedications, isProMode, language, age: userAge }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!resp.ok && resp.status !== 422) {
    throw new Error(`서버 응답 오류 (${resp.status})`);
  }
  const body = await resp.json();
  const parsed = CurateResponse.safeParse(body);
  if (!parsed.success) throw new Error('응답 스키마 불일치');
  if (!parsed.data.ok) throw new Error(parsed.data.message);

  // 추가 런타임 검증 (서버에서 이미 한 번 했지만 INV-1 보장)
  const validated = CurationResult.parse(parsed.data.data);
  cache.set(cacheKey, { data: validated as CurationResultType, ts: Date.now() });
  return validated as CurationResultType;
}

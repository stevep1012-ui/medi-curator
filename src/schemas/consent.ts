// 동의·DSR(정보주체 요구권) 스키마 — PIPA §15, §22, §22-2, §23, §28-8 대응
// 클라이언트/서버/Firestore Rules 가 모두 이 정의를 따른다.
import { z } from 'zod';

// 현재 운영 동의서 버전. 약관 변경 시 bump → 사용자에게 재동의 요청.
// 형식: YYYY-MM-DD (UI에 그대로 노출 가능)
export const CONSENT_VERSION = '2026-06-01';

// 만 14세 미만 차단 (PIPA §22-2). UI에서 생년월일 검사 후 차단/법정대리인 동의 유도.
export const MIN_AGE_YEARS = 14;

export const ConsentItems = z.object({
  // (필수) 일반 개인정보: 이메일·구글 프로필
  pii: z.literal(true, { message: '필수 동의 항목입니다' }),
  // (필수) PIPA §23 민감정보 — 증상·복용약·검색이력
  sensitiveHealth: z.literal(true, { message: '서비스 이용을 위해 필수입니다' }),
  // (필수) PIPA §28-8 국외이전 — Gemini(미국), Firebase(미국/asia-northeast3)
  overseasTransfer: z.literal(true, { message: '서비스 이용을 위해 필수입니다' }),
  // (필수) 위치정보법 §15 — 약국 검색 시
  location: z.literal(true, { message: '약국 검색 기능에 필요합니다' }),
  // (선택) 마케팅·통계 활용
  marketing: z.boolean().default(false),
  analytics: z.boolean().default(false),
});
export type ConsentItems = z.infer<typeof ConsentItems>;

export const ConsentRecord = z.object({
  version: z.string(),
  acceptedAt: z.string(), // ISO timestamp (Timestamp 변환은 서비스 레이어)
  items: ConsentItems,
  // PIPA §22-2 확인용. 생년월일 직접 저장 대신 성인 여부만 보관.
  isAdult: z.boolean(),
  // 동의 출처 UI/디바이스 정보 (최소 수집 원칙: UA 만)
  userAgent: z.string().max(500).optional(),
});
export type ConsentRecord = z.infer<typeof ConsentRecord>;

// === DSR (Data Subject Request) ===
export const DSRType = z.enum(['access', 'rectify', 'erase', 'export']);
export type DSRType = z.infer<typeof DSRType>;

export const DSRRequest = z.object({
  type: DSRType,
  // 정정(rectify) 시 필드별 patch (예: 동의 항목 변경)
  patch: z.record(z.string(), z.unknown()).optional(),
  // 사용자 본인 확인용 — Firebase Auth ID 토큰
  // (서버에서 Authorization: Bearer <idToken> 헤더로 받음)
});

export const DSRResponse = z.union([
  z.object({
    ok: z.literal(true),
    type: DSRType,
    // access: 사용자 데이터 스냅샷
    // export: 다운로드 URL (Cloud Storage signed URL) 또는 인라인 JSON
    // erase/rectify: receipt
    data: z.unknown().optional(),
    receipt: z.object({
      requestId: z.string(),
      processedAt: z.string(),
      affectedDocs: z.number().int().nonnegative(),
    }),
  }),
  z.object({ ok: z.literal(false), code: z.string(), message: z.string() }),
]);

export function isAdult(birthYear: number, birthMonth: number, birthDay: number, now = new Date()): boolean {
  const cutoff = new Date(now.getFullYear() - MIN_AGE_YEARS, now.getMonth(), now.getDate());
  const dob = new Date(birthYear, birthMonth - 1, birthDay);
  return dob <= cutoff;
}

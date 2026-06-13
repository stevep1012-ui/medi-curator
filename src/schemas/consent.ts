// PIPA consent schemas. The consent record is written to Firestore at
// users/{uid}/consents/{CONSENT_VERSION} and is required by the curate
// Cloud Function (sensitiveHealth + isAdult). PIPA §23 mandates separate
// explicit consent for sensitive (health) data — the four required items
// must all be true.
import { z } from 'zod';

export const CONSENT_VERSION = '2026-06-01';

export const ConsentItems = z.object({
  // Required (PIPA §23 separate consent) — must be explicitly true.
  pii: z.literal(true),
  sensitiveHealth: z.literal(true),
  overseasTransfer: z.literal(true),
  location: z.literal(true),
  // Optional — may be false.
  marketing: z.boolean(),
  analytics: z.boolean(),
});

export const ConsentRecord = z.object({
  version: z.string().min(1),
  acceptedAt: z.string().min(1), // ISO 8601
  items: ConsentItems,
  isAdult: z.boolean(),
});

export type ConsentItemsT = z.infer<typeof ConsentItems>;
export type ConsentRecordT = z.infer<typeof ConsentRecord>;

// 만 14세 경계 (PIPA §22-2: 만 14세 미만은 법정대리인 동의 필요).
// Returns true when the person is at least 14 on `now` (true on the 14th birthday).
export function isAdult(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  now: Date = new Date(),
): boolean {
  let age = now.getUTCFullYear() - birthYear;
  const monthDiff = now.getUTCMonth() + 1 - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthDay)) {
    age -= 1;
  }
  return age >= 14;
}

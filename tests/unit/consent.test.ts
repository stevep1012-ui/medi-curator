import { describe, it, expect } from 'vitest';
import { ConsentItems, ConsentRecord, isAdult, CONSENT_VERSION } from '../../src/schemas/consent';

describe('Consent schemas', () => {
  it('ConsentItems: 필수 4종 모두 true 이면 통과', () => {
    const ok = ConsentItems.safeParse({
      pii: true, sensitiveHealth: true, overseasTransfer: true, location: true,
      marketing: false, analytics: false,
    });
    expect(ok.success).toBe(true);
  });

  it('ConsentItems: 필수 1개라도 false 면 거부 (PIPA §23 별도 동의)', () => {
    const bad = ConsentItems.safeParse({
      pii: true, sensitiveHealth: false, overseasTransfer: true, location: true,
      marketing: false, analytics: false,
    });
    expect(bad.success).toBe(false);
  });

  it('ConsentRecord: 최소 필드 통과', () => {
    const ok = ConsentRecord.safeParse({
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
      items: { pii: true, sensitiveHealth: true, overseasTransfer: true, location: true, marketing: false, analytics: false },
      isAdult: true,
    });
    expect(ok.success).toBe(true);
  });

  it('isAdult: 만 14세 경계 정확 (PIPA §22-2)', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    expect(isAdult(2012, 6, 1, now)).toBe(true);  // 정확히 14세 생일
    expect(isAdult(2012, 6, 2, now)).toBe(false); // 하루 뒤 출생 → 13세
    expect(isAdult(2010, 1, 1, now)).toBe(true);  // 16세
    expect(isAdult(2020, 1, 1, now)).toBe(false); // 6세
  });
});

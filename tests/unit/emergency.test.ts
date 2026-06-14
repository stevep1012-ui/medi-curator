// R-005 회귀 가드 — 공유 응급 분류기(클라이언트 즉시 감지).
import { describe, it, expect } from 'vitest';
import { detectEmergency, HOTLINES } from '../../src/lib/emergency';

describe('detectEmergency', () => {
  it('정신 응급(자살/자해) → mental', () => {
    expect(detectEmergency('죽고 싶다는 생각이 들어요')).toBe('mental');
    expect(detectEmergency('요즘 자해 충동이 있어요')).toBe('mental');
    expect(detectEmergency('I want to kill myself')).toBe('mental');
  });

  it('신체 응급(흉통 등) → physical', () => {
    expect(detectEmergency('갑자기 가슴통증이 심해요')).toBe('physical');
    expect(detectEmergency('숨을 못 쉬겠어요')).toBe('physical');
    expect(detectEmergency('chest pain since morning')).toBe('physical');
  });

  it('일반 증상 → null (오탐 방지)', () => {
    expect(detectEmergency('콧물이 나요')).toBeNull();
    expect(detectEmergency('두통과 미열이 있어요')).toBeNull();
    expect(detectEmergency('')).toBeNull();
  });

  it('정신 응급이 신체보다 우선(둘 다 포함 시)', () => {
    expect(detectEmergency('가슴통증도 있고 죽고 싶어요')).toBe('mental');
  });

  it('HOTLINES: 정신 위기는 109+1577-0199 우선, 119 단독 아님', () => {
    expect(HOTLINES.mental.map((h) => h.tel)).toEqual(['109', '1577-0199']);
    expect(HOTLINES.physical.map((h) => h.tel)).toEqual(['119']);
  });
});

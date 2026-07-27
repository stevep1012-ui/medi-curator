// R-005 회귀 가드 — 공유 응급 분류기(클라이언트 즉시 감지).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { detectEmergency, HOTLINES, MENTAL_KEYWORDS, PHYSICAL_KEYWORDS } from '../../src/lib/emergency';

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

  it("단독 '마비'도 physical (서버만 잡던 회귀 방지)", () => {
    expect(detectEmergency('오늘 아침부터 다리가 마비된 느낌이에요')).toBe('physical');
  });
});

// 클라이언트 키워드가 서버보다 좁으면, 서버가 응급으로 판정하는 문장에서도
// 즉시 뜨는 위기 배너가 왕복 응답 전까지 숨겨진다. 두 목록을 소스에서 직접
// 비교해 그 격차를 빌드 타임에 잡는다.
describe('클라이언트 ↔ 서버 응급 키워드 패리티', () => {
  // vitest 는 프로젝트 루트를 cwd 로 실행한다(import.meta.url 은 변환 후 file 스킴이 아님).
  const serverSource = readFileSync(resolve(process.cwd(), 'functions/src/index.ts'), 'utf8');

  function serverKeywords(constName: string): string[] {
    const declaration = new RegExp(`const ${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`).exec(serverSource);
    if (!declaration) throw new Error(`서버 소스에서 ${constName} 선언을 찾지 못했습니다`);
    return [...declaration[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  }

  it('서버 EMERGENCY_MENTAL 과 동일', () => {
    expect(MENTAL_KEYWORDS).toEqual(serverKeywords('EMERGENCY_MENTAL'));
  });

  it('서버 EMERGENCY_PHYSICAL 과 동일', () => {
    expect(PHYSICAL_KEYWORDS).toEqual(serverKeywords('EMERGENCY_PHYSICAL'));
  });
});

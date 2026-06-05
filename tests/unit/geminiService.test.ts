import { describe, it, expect, vi } from 'vitest';
import { getCurationFromGemini } from '../../src/services/geminiService';

describe('geminiService (서버 프록시 호출)', () => {
  it('정상 응답을 Zod 검증 후 반환한다', async () => {
    const result = await getCurationFromGemini('두통이 있어요', '', false, 'ko');
    expect(result.recommendedDepartment).toBe('내과');
    expect(result.disclaimer).toBeTruthy(); // INV-1
    expect(result.otcMedications.length).toBeGreaterThan(0);
  });

  it('같은 입력은 캐시에서 즉시 반환된다 (fetch 1회)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    spy.mockClear();
    await getCurationFromGemini('동일증상캐시테스트', '', false, 'ko');
    const before = spy.mock.calls.length;
    await getCurationFromGemini('동일증상캐시테스트', '', false, 'ko');
    expect(spy.mock.calls.length).toBe(before); // 두 번째 호출은 fetch 안 함
  });

  it('서버가 422 FORBIDDEN 을 반환하면 사용자 친화 에러로 던진다', async () => {
    await expect(
      getCurationFromGemini('FORCE_FORBIDDEN trigger', '', false, 'ko'),
    ).rejects.toThrow(/금지 표현/);
  });

  it('서버 5xx 면 에러를 던진다 (UI 화이트스크린 방지)', async () => {
    await expect(
      getCurationFromGemini('FORCE_500 panic', '', false, 'ko'),
    ).rejects.toThrow();
  });
});

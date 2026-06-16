import { describe, it, expect } from 'vitest';
import { getInteractionFromAI, getPairingFromAI } from '../../src/services/aiToolsService';
import { InteractionAIResult, PairingAIResult } from '../../src/schemas/aiTools';

describe('aiToolsService — interaction (자유 입력 AI 판단)', () => {
  it('정상 응답을 Zod 검증 후 반환한다', async () => {
    const r = await getInteractionFromAI('비타민 K', '와파린', false, 'ko');
    expect(r.topics[0].pair).toContain('와파린');
    expect(r.disclaimer).toBeTruthy();
  });

  it('severity 는 info/caution 만 허용한다 (RT-005, danger 금지)', () => {
    const bad = InteractionAIResult.safeParse({
      topics: [{ pair: 'a + b', topic: 't', severity: 'danger' }],
      generalNote: '',
      disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
    });
    expect(bad.success).toBe(false);
  });

  it('서버 422 FORBIDDEN 을 사용자 친화 에러로 던진다', async () => {
    await expect(getInteractionFromAI('FORCE_FORBIDDEN', '약', false, 'ko')).rejects.toThrow();
  });

  it('서버 403 을 동의 안내로 변환한다', async () => {
    await expect(getInteractionFromAI('FORCE_403', '약', false, 'ko')).rejects.toThrow('민감정보 동의가 필요합니다.');
  });
});

describe('aiToolsService — pairing (자유 목표 AI 판단)', () => {
  it('정상 응답을 Zod 검증 후 반환한다', async () => {
    const r = await getPairingFromAI('눈 피로', false, 'ko');
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.goalLabel).toBeTruthy();
    expect(r.disclaimer).toBeTruthy();
  });

  it('items 가 비면 스키마가 거부한다', () => {
    const bad = PairingAIResult.safeParse({
      goalLabel: 'g', summary: 's', items: [], tip: '', disclaimer: '일반적인 영양 정보이며 의학적 조언이 아닙니다.',
    });
    expect(bad.success).toBe(false);
  });

  it('서버 5xx 면 에러를 던진다 (UI 화이트스크린 방지)', async () => {
    await expect(getPairingFromAI('FORCE_500', false, 'ko')).rejects.toThrow();
  });
});

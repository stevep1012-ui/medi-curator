import { beforeEach, describe, expect, it } from 'vitest';
import { clearCombos, deleteCombo, exportCombosText, loadSavedCombos, saveCombo } from '../../src/services/comboVaultService';

const combo = {
  title: '얼박사 · 박카스+사이다',
  category: '편의점 맛조합',
  summary: '맛 조합입니다.',
  items: [
    { name: '박카스 1병', why: '베이스' },
    { name: '사이다', why: '청량감' },
  ],
  tip: '카페인·당 주의',
  disclaimer: '일반 정보입니다.',
};

describe('comboVaultService', () => {
  beforeEach(() => clearCombos());

  it('saves and reloads combo vault items', () => {
    const saved = saveCombo(combo);
    expect(saved).toHaveLength(1);
    expect(loadSavedCombos()[0].title).toBe(combo.title);
  });

  it('deduplicates by title and keeps the newest version first', () => {
    saveCombo(combo);
    const next = saveCombo({ ...combo, summary: '새 요약' });
    expect(next).toHaveLength(1);
    expect(next[0].summary).toBe('새 요약');
  });

  it('deletes saved combos by id', () => {
    const [saved] = saveCombo(combo);
    expect(deleteCombo(saved.id)).toHaveLength(0);
  });

  it('exports a consultation/shopping-list friendly text summary', () => {
    const saved = saveCombo(combo);
    const text = exportCombosText(saved, 'ko');
    expect(text).toContain('MediQ 꿀조합 보관함');
    expect(text).toContain('박카스 1병');
    expect(text).toContain('진단, 처방 또는 치료');
  });
});

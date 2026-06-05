import { describe, it, expect } from 'vitest';
import { CurationResult, SymptomQuery, violatesForbidden } from '../../src/schemas/curation';

describe('Zod schemas (curation)', () => {
  it('CurationResult: 정상 페이로드 통과', () => {
    const ok = CurationResult.safeParse({
      recommendedDepartment: '내과',
      aiAdvice: '쉬세요',
      otcMedications: [],
      folkRemedies: [],
      lifestyleTips: [],
      exercisePrescription: { recommended: [], avoid: [], duration: '0분' },
      recoveryTimeline: [],
      redFlags: [],
      disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
    });
    expect(ok.success).toBe(true);
  });

  it('CurationResult: 빈 disclaimer 거부 (INV-1)', () => {
    const bad = CurationResult.safeParse({
      recommendedDepartment: '내과',
      aiAdvice: '쉬세요',
      otcMedications: [],
      folkRemedies: [],
      lifestyleTips: [],
      exercisePrescription: { recommended: [], avoid: [], duration: '0분' },
      recoveryTimeline: [],
      redFlags: [],
      disclaimer: '',
    });
    expect(bad.success).toBe(false);
  });

  it('SymptomQuery: 3자 미만 거부', () => {
    expect(SymptomQuery.safeParse({ symptoms: 'ab', currentMedications: '' }).success).toBe(false);
    expect(SymptomQuery.safeParse({ symptoms: '두통이' }).success).toBe(true);
  });

  it('violatesForbidden: 의료법 §27 위반 어휘 차단', () => {
    expect(violatesForbidden('당신은 감기로 진단됩니다.')).toMatch(/진단/);
    expect(violatesForbidden('타이레놀 처방해드립니다')).toMatch(/처방/);
    expect(violatesForbidden('완치됩니다 확실히')).toMatch(/완치/);
    expect(violatesForbidden('일반적인 정보 안내입니다')).toBeNull();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { clearLocalAccountData } from '../../src/services/accountDataService';
import { addMed, loadMeds } from '../../src/services/medStore';
import { exportLocalSearchHistory, saveSearchRecord } from '../../src/services/symptomService';
import type { CurationResult } from '../../src/types';

const result: CurationResult = {
  recommendedDepartment: '가정의학과',
  aiAdvice: '일반 점검',
  otcMedications: [],
  folkRemedies: [],
  lifestyleTips: ['휴식'],
  exercisePrescription: { recommended: [], avoid: [], duration: '휴식' },
  recoveryTimeline: [{ ageGroup: 'adult', expectedDays: '2-3일', notes: '악화 시 진료' }],
  redFlags: ['악화 시 진료'],
  disclaimer: '일반 정보입니다.',
};

describe('accountDataService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears device-local member profile, saved meds, and search history for one user', async () => {
    const uid = 'user-1';
    const otherUid = 'user-2';

    localStorage.setItem(`medi-curator:member-profile:${uid}`, JSON.stringify({ nickname: 'Steve' }));
    localStorage.setItem(`medi-curator:member-profile:${otherUid}`, JSON.stringify({ nickname: 'Other' }));
    addMed(uid, {
      name: '비타민 C',
      category: 'vitamin',
      ingredients: ['ascorbic acid'],
      efficacy: '보충',
      cautions: [],
      disclaimer: '저장된 약 정보는 직접 확인이 필요합니다.',
    });
    addMed(otherUid, {
      name: '마그네슘',
      category: 'vitamin',
      ingredients: ['magnesium'],
      efficacy: '보충',
      cautions: [],
      disclaimer: '저장된 약 정보는 직접 확인이 필요합니다.',
    });
    await saveSearchRecord(uid, '기침', '', result, 'ko');
    await saveSearchRecord(otherUid, '두통', '', result, 'ko');

    await clearLocalAccountData(uid);

    expect(localStorage.getItem(`medi-curator:member-profile:${uid}`)).toBeNull();
    expect(loadMeds(uid)).toHaveLength(0);
    expect(await exportLocalSearchHistory(uid)).toHaveLength(0);

    expect(localStorage.getItem(`medi-curator:member-profile:${otherUid}`)).not.toBeNull();
    expect(loadMeds(otherUid)).toHaveLength(1);
    expect(await exportLocalSearchHistory(otherUid)).toHaveLength(1);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { clearLocalAccountData } from '../../src/services/accountDataService';
import { loadSavedCombos, saveCombo } from '../../src/services/comboVaultService';
import { loadHealthProfile, saveHealthProfile } from '../../src/services/healthProfileService';
import { addMed, loadMeds } from '../../src/services/medStore';
import { loadPlusInterest, savePlusInterest } from '../../src/services/plusInterestService';
import { loadRoutineProgress, saveRoutineProgress } from '../../src/services/routineProgressService';
import { loadRoutineReminder, saveRoutineReminder } from '../../src/services/routineReminderService';
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

  it('clears device-local member profile, saved meds, combo vault, health profile, Plus interest, routine progress, reminder, and search history for one user', async () => {
    const uid = 'user-1';
    const otherUid = 'user-2';

    localStorage.setItem(`medi-curator:member-profile:${uid}`, JSON.stringify({ nickname: 'Steve' }));
    localStorage.setItem(`medi-curator:member-profile:${otherUid}`, JSON.stringify({ nickname: 'Other' }));
    addMed(uid, {
      recognized: true,
      name: '비타민 C',
      category: 'vitamin',
      ingredients: ['ascorbic acid'],
      efficacy: '보충',
      cautions: [],
      disclaimer: '저장된 약 정보는 직접 확인이 필요합니다.',
    });
    addMed(otherUid, {
      recognized: true,
      name: '마그네슘',
      category: 'vitamin',
      ingredients: ['magnesium'],
      efficacy: '보충',
      cautions: [],
      disclaimer: '저장된 약 정보는 직접 확인이 필요합니다.',
    });
    await saveSearchRecord(uid, '기침', '', result, 'ko');
    await saveSearchRecord(otherUid, '두통', '', result, 'ko');
    saveCombo({
      title: '얼박사',
      category: 'taste',
      summary: '맛 조합',
      items: [{ name: '박카스', why: '베이스' }],
      tip: '카페인 주의',
      disclaimer: '일반 정보입니다.',
    }, uid);
    saveCombo({
      title: '칼마디',
      category: 'nutrition',
      summary: '영양 조합',
      items: [{ name: '비타민 D', why: '칼슘 이용' }],
      tip: '식후',
      disclaimer: '일반 정보입니다.',
    }, otherUid);
    savePlusInterest(uid);
    savePlusInterest(otherUid);
    saveHealthProfile(uid, { conditionStatus: 'has', conditionsText: '고혈압', allergiesText: '', notes: '' });
    saveHealthProfile(otherUid, { conditionStatus: 'has', conditionsText: '천식', allergiesText: '', notes: '' });
    saveRoutineProgress(uid, { '2026-07-16': ['meds', 'combo'] });
    saveRoutineProgress(otherUid, { '2026-07-16': ['pharmacy'] });
    saveRoutineReminder(uid, { enabled: true, frequency: 'daily', time: '20:00' });
    saveRoutineReminder(otherUid, { enabled: true, frequency: 'weekly', time: '09:00' });

    await clearLocalAccountData(uid);

    expect(localStorage.getItem(`medi-curator:member-profile:${uid}`)).toBeNull();
    expect(loadMeds(uid)).toHaveLength(0);
    expect(loadSavedCombos(uid)).toHaveLength(0);
    expect(loadHealthProfile(uid).conditionStatus).toBe('unknown');
    expect(loadPlusInterest(uid).interested).toBe(false);
    expect(loadRoutineProgress(uid)).toEqual({});
    expect(loadRoutineReminder(uid).enabled).toBe(false);
    expect(await exportLocalSearchHistory(uid)).toHaveLength(0);

    expect(localStorage.getItem(`medi-curator:member-profile:${otherUid}`)).not.toBeNull();
    expect(loadMeds(otherUid)).toHaveLength(1);
    expect(loadSavedCombos(otherUid)).toHaveLength(1);
    expect(loadHealthProfile(otherUid).conditionsText).toBe('천식');
    expect(loadPlusInterest(otherUid).interested).toBe(true);
    expect(loadRoutineProgress(otherUid)).toEqual({ '2026-07-16': ['pharmacy'] });
    expect(loadRoutineReminder(otherUid).enabled).toBe(true);
    expect(await exportLocalSearchHistory(otherUid)).toHaveLength(1);
  });
});

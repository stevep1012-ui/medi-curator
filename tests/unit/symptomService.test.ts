import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteAllSearchRecords,
  deleteSearchRecord,
  exportLocalSearchHistory,
  getSearchHistory,
  saveSearchRecord,
} from '../../src/services/symptomService';
import type { CurationResult } from '../../src/types';

const result: CurationResult = {
  recommendedDepartment: '내과',
  aiAdvice: '의료 전문가 상담이 필요할 수 있습니다.',
  otcMedications: [],
  folkRemedies: [],
  lifestyleTips: [],
  exercisePrescription: { recommended: [], avoid: [], duration: '' },
  recoveryTimeline: [],
  redFlags: [],
  disclaimer: '본 정보는 의료 진단 또는 처방을 대체하지 않습니다.',
};

describe('symptomService local device storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('사용자별 로컬 저장소에만 검색 이력을 저장한다', async () => {
    const id = await saveSearchRecord('user-1', '두통', '없음', result, 'ko');

    const { records } = await getSearchHistory('user-1');
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(id);
    expect(records[0].symptoms).toBeUndefined();
    expect(records[0].result).toBeUndefined();
    expect(localStorage.getItem('medi-curator:searchHistory:user-1')).not.toContain('두통');
  });

  it('사용자별 이력을 분리한다', async () => {
    await saveSearchRecord('user-1', '두통', '', result, 'ko');
    await saveSearchRecord('user-2', '복통', '', result, 'ko');

    expect((await getSearchHistory('user-1')).records[0].language).toBe('ko');
    expect((await getSearchHistory('user-2')).records[0].language).toBe('ko');
  });

  it('삭제와 export를 지원한다', async () => {
    const id = await saveSearchRecord('user-1', '기침', '', result, 'ko');
    expect(await exportLocalSearchHistory('user-1')).toHaveLength(1);

    await deleteSearchRecord('user-1', id);
    expect((await getSearchHistory('user-1')).records).toHaveLength(0);

    await saveSearchRecord('user-1', '발열', '', result, 'ko');
    await deleteAllSearchRecords('user-1');
    expect(await exportLocalSearchHistory('user-1')).toHaveLength(0);
  });
});

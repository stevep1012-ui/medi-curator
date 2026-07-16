import { beforeEach, describe, expect, it } from 'vitest';
import { clearHealthProfile, loadHealthProfile, saveHealthProfile } from '../../src/services/healthProfileService';

describe('healthProfileService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores self-reported health profile locally per user', () => {
    saveHealthProfile('user-1', {
      conditionStatus: 'has',
      conditionsText: '고혈압',
      allergiesText: '페니실린',
      notes: '상담 전 확인',
    });
    saveHealthProfile('user-2', {
      conditionStatus: 'none',
      conditionsText: '',
      allergiesText: '',
      notes: '',
    });

    expect(loadHealthProfile('user-1')).toMatchObject({
      conditionStatus: 'has',
      conditionsText: '고혈압',
      allergiesText: '페니실린',
    });
    expect(loadHealthProfile('user-2').conditionStatus).toBe('none');
  });

  it('clears only the requested user profile', () => {
    saveHealthProfile('user-1', { conditionStatus: 'has', conditionsText: '천식', allergiesText: '', notes: '' });
    saveHealthProfile('user-2', { conditionStatus: 'has', conditionsText: '당뇨', allergiesText: '', notes: '' });

    clearHealthProfile('user-1');

    expect(loadHealthProfile('user-1').conditionStatus).toBe('unknown');
    expect(loadHealthProfile('user-2').conditionsText).toBe('당뇨');
  });
});

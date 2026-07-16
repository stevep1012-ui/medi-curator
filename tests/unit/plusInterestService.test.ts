import { beforeEach, describe, expect, it } from 'vitest';
import { clearPlusInterest, loadPlusInterest, savePlusInterest } from '../../src/services/plusInterestService';

describe('plusInterestService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reloads Plus interest per signed-in user', () => {
    const saved = savePlusInterest('user-1');

    expect(saved.interested).toBe(true);
    expect(saved.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(loadPlusInterest('user-1').interested).toBe(true);
    expect(loadPlusInterest('user-2').interested).toBe(false);
  });

  it('ignores invalid stored values safely', () => {
    localStorage.setItem('medi-curator:plus-interest:user-1', '{bad json');

    expect(loadPlusInterest('user-1')).toEqual({ interested: false, savedAt: '' });
  });

  it('clears only the selected user signal', () => {
    savePlusInterest('user-1');
    savePlusInterest('user-2');

    clearPlusInterest('user-1');

    expect(loadPlusInterest('user-1').interested).toBe(false);
    expect(loadPlusInterest('user-2').interested).toBe(true);
  });
});

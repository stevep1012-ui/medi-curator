import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLocalMemberProfileData, loadMemberProfile, saveMemberProfile } from '../../src/services/memberProfileService';

vi.mock('../../src/firebase', () => ({
  getDb: vi.fn(() => Promise.reject(new Error('Firestore disabled in unit tests'))),
}));

describe('memberProfileService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores a nickname by normalized login email across different auth uids on the same device', async () => {
    await saveMemberProfile('google-uid', {
      nickname: '스티브',
      loginEmail: 'Steve@Example.com',
      answerEmail: 'Steve@Example.com',
      answerEmailSource: 'login',
      answerEmailVerified: true,
    });

    const profile = await loadMemberProfile('naver-uid', 'steve@example.com');

    expect(profile?.nickname).toBe('스티브');
    expect(profile?.loginEmail).toBe('steve@example.com');
    expect(profile?.answerEmail).toBe('steve@example.com');
  });

  it('clears both uid-scoped and email-alias local profile records', async () => {
    await saveMemberProfile('uid-1', {
      nickname: '스티브',
      loginEmail: 'steve@example.com',
      answerEmail: 'steve@example.com',
      answerEmailSource: 'login',
      answerEmailVerified: true,
    });

    clearLocalMemberProfileData('uid-1');

    expect(await loadMemberProfile('uid-1', 'steve@example.com')).toBeNull();
  });
});

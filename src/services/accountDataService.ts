import { deleteDoc, doc } from 'firebase/firestore';
import { getDb } from '../firebase';
import { CONSENT_VERSION } from '../schemas/consent';
import { clearCombos } from './comboVaultService';
import { clearHealthProfile } from './healthProfileService';
import { clearLocalMemberProfileData, deleteMemberProfileData, loadMemberProfile } from './memberProfileService';
import { deleteAllMeds } from './medStore';
import { clearPlusInterest } from './plusInterestService';
import { clearRoutineProgress } from './routineProgressService';
import { clearRoutineReminder } from './routineReminderService';
import { deleteAllSearchRecords } from './symptomService';

export interface AccountDataDeletionResult {
  localCleared: boolean;
  remoteProfileDeleted: boolean;
  remoteConsentDeleted: boolean;
  remoteError?: string;
}

export async function clearLocalAccountData(uid: string): Promise<void> {
  deleteAllMeds(uid);
  clearCombos(uid);
  clearPlusInterest(uid);
  clearHealthProfile(uid);
  clearRoutineProgress(uid);
  clearRoutineReminder(uid);
  await deleteAllSearchRecords(uid);
  clearLocalMemberProfileData(uid);
}

export async function deleteAccountData(uid: string): Promise<AccountDataDeletionResult> {
  const profile = await loadMemberProfile(uid);
  await clearLocalAccountData(uid);

  const result: AccountDataDeletionResult = {
    localCleared: true,
    remoteProfileDeleted: false,
    remoteConsentDeleted: false,
  };

  try {
    const db = await getDb();
    await Promise.allSettled([
      deleteMemberProfileData(uid, profile?.loginEmail).then(() => {
        result.remoteProfileDeleted = true;
      }),
      deleteDoc(doc(db, 'users', uid, 'consents', CONSENT_VERSION)).then(() => {
        result.remoteConsentDeleted = true;
      }),
    ]).then((settled) => {
      const rejected = settled.find((entry): entry is PromiseRejectedResult => entry.status === 'rejected');
      if (rejected) {
        result.remoteError = rejected.reason instanceof Error ? rejected.reason.message : '원격 데이터 일부 삭제에 실패했습니다.';
      }
    });
  } catch (error) {
    result.remoteError = error instanceof Error ? error.message : '원격 데이터 삭제에 실패했습니다.';
  }

  return result;
}

import { deleteDoc, doc } from 'firebase/firestore';
import { getDb } from '../firebase';
import { CONSENT_VERSION } from '../schemas/consent';
import { deleteAllMeds } from './medStore';
import { deleteAllSearchRecords } from './symptomService';

const profileFallbackKey = (uid: string) => `medi-curator:member-profile:${uid}`;

export interface AccountDataDeletionResult {
  localCleared: boolean;
  remoteProfileDeleted: boolean;
  remoteConsentDeleted: boolean;
  remoteError?: string;
}

export async function clearLocalAccountData(uid: string): Promise<void> {
  deleteAllMeds(uid);
  await deleteAllSearchRecords(uid);
  localStorage.removeItem(profileFallbackKey(uid));
}

export async function deleteAccountData(uid: string): Promise<AccountDataDeletionResult> {
  await clearLocalAccountData(uid);

  const result: AccountDataDeletionResult = {
    localCleared: true,
    remoteProfileDeleted: false,
    remoteConsentDeleted: false,
  };

  try {
    const db = await getDb();
    await Promise.allSettled([
      deleteDoc(doc(db, 'users', uid, 'profile', 'main')).then(() => {
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

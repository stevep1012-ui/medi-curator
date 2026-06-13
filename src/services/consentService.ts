// PIPA consent persistence. Writes/reads the consent record the curate Cloud
// Function requires at users/{uid}/consents/{CONSENT_VERSION}.
//
// NOTE (legal gate): this module is the persistence MECHANISM only. The exact
// consent items, copy, and the adult-verification (isAdult) flow are governed by
// AGENTS.md and require legal-advisor + medical-reviewer sign-off before
// production. Callers must not invent consent semantics here.
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '../firebase';
import { ConsentRecord, CONSENT_VERSION, type ConsentItemsT } from '../schemas/consent';

export async function saveConsent(
  uid: string,
  items: ConsentItemsT,
  isAdult: boolean,
): Promise<void> {
  const record = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    items,
    isAdult,
  };
  const parsed = ConsentRecord.safeParse(record);
  if (!parsed.success) {
    throw new Error('동의 정보가 올바르지 않습니다.');
  }
  const db = await getDb();
  await setDoc(doc(db, 'users', uid, 'consents', CONSENT_VERSION), parsed.data);
}

export async function hasConsent(uid: string): Promise<boolean> {
  try {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'users', uid, 'consents', CONSENT_VERSION));
    const data = snap.data();
    return Boolean(data?.items?.sensitiveHealth) && data?.isAdult === true;
  } catch {
    return false;
  }
}

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { getDb } from '../firebase';

export const MemberProfile = z.object({
  nickname: z.string().min(1).max(40),
  loginEmail: z.string().email().nullable(),
  answerEmail: z.string().email(),
  answerEmailSource: z.enum(['login', 'custom']),
  answerEmailVerified: z.boolean(),
  onboardingCompletedAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
});

export type MemberProfileT = z.infer<typeof MemberProfile>;

const fallbackKey = (uid: string) => `medi-curator:member-profile:${uid}`;

export async function loadMemberProfile(uid: string): Promise<MemberProfileT | null> {
  try {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
    if (snap.exists()) {
      const parsed = MemberProfile.safeParse(snap.data());
      if (parsed.success) return parsed.data;
    }
  } catch {
    /* Firestore may be unavailable locally; fall back to device storage. */
  }

  try {
    const raw = localStorage.getItem(fallbackKey(uid));
    if (!raw) return null;
    const parsed = MemberProfile.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveMemberProfile(uid: string, profile: Omit<MemberProfileT, 'onboardingCompletedAt' | 'updatedAt'>): Promise<MemberProfileT> {
  const parsed = MemberProfile.omit({ onboardingCompletedAt: true, updatedAt: true }).parse(profile);
  const localProfile: MemberProfileT = {
    ...parsed,
    onboardingCompletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await getDb();
    await setDoc(
      doc(db, 'users', uid, 'profile', 'main'),
      {
        ...parsed,
        onboardingCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    /* Keep onboarding usable even if Firestore is temporarily unavailable. */
  }

  localStorage.setItem(fallbackKey(uid), JSON.stringify(localProfile));
  return localProfile;
}

import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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
const emailAliasKey = (email: string) => `medi-curator:member-profile-email:${emailKey(email)}`;

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function emailKey(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase());
}

function parseProfile(data: unknown): MemberProfileT | null {
  const parsed = MemberProfile.safeParse(data);
  return parsed.success ? parsed.data : null;
}

function loadLocalProfileByUid(uid: string): MemberProfileT | null {
  try {
    const raw = localStorage.getItem(fallbackKey(uid));
    if (!raw) return null;
    return parseProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

function loadLocalProfileByEmail(email: string | null): MemberProfileT | null {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(emailAliasKey(email));
    if (!raw) return null;
    return parseProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveLocalProfile(uid: string, profile: MemberProfileT): void {
  localStorage.setItem(fallbackKey(uid), JSON.stringify(profile));
  const normalized = normalizeEmail(profile.loginEmail);
  if (normalized) localStorage.setItem(emailAliasKey(normalized), JSON.stringify(profile));
}

export async function loadMemberProfile(uid: string, loginEmail?: string | null): Promise<MemberProfileT | null> {
  const normalizedEmail = normalizeEmail(loginEmail);
  try {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
    if (snap.exists()) {
      const profile = parseProfile(snap.data());
      if (profile) return profile;
    }
    if (normalizedEmail) {
      const aliasSnap = await getDoc(doc(db, 'memberProfilesByEmail', emailKey(normalizedEmail)));
      if (aliasSnap.exists()) {
        const profile = parseProfile(aliasSnap.data());
        if (profile) return profile;
      }
    }
  } catch {
    /* Firestore may be unavailable locally; fall back to device storage. */
  }

  return loadLocalProfileByUid(uid) ?? loadLocalProfileByEmail(normalizedEmail);
}

export async function saveMemberProfile(uid: string, profile: Omit<MemberProfileT, 'onboardingCompletedAt' | 'updatedAt'>): Promise<MemberProfileT> {
  const parsed = MemberProfile.omit({ onboardingCompletedAt: true, updatedAt: true }).parse({
    ...profile,
    loginEmail: normalizeEmail(profile.loginEmail),
    answerEmail: profile.answerEmail.trim().toLowerCase(),
  });
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
    if (parsed.loginEmail) {
      await setDoc(
        doc(db, 'memberProfilesByEmail', emailKey(parsed.loginEmail)),
        {
          ...parsed,
          sourceUid: uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  } catch {
    /* Keep onboarding usable even if Firestore is temporarily unavailable. */
  }

  saveLocalProfile(uid, localProfile);
  return localProfile;
}

export function clearLocalMemberProfileData(uid: string, loginEmail?: string | null): void {
  const profile = loadLocalProfileByUid(uid);
  const normalized = normalizeEmail(loginEmail ?? profile?.loginEmail);
  localStorage.removeItem(fallbackKey(uid));
  if (normalized) localStorage.removeItem(emailAliasKey(normalized));
}

export async function deleteMemberProfileData(uid: string, loginEmail?: string | null): Promise<void> {
  const normalized = normalizeEmail(loginEmail ?? loadLocalProfileByUid(uid)?.loginEmail);
  clearLocalMemberProfileData(uid, normalized);

  const db = await getDb();
  await Promise.allSettled([
    deleteDoc(doc(db, 'users', uid, 'profile', 'main')),
    normalized ? deleteDoc(doc(db, 'memberProfilesByEmail', emailKey(normalized))) : Promise.resolve(),
  ]);
}

import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { FREE_USAGE_LIMITS } from './usageLimits';

export const USAGE_SETTINGS_COLLECTION = 'adminConfig';
export const USAGE_SETTINGS_DOC = 'usageLimits';

export const UsageLimitsSchema = z.object({
  hourlyAiRequests: z.number().int().min(1).max(10_000),
  monthlyAiRequests: z.number().int().min(1).max(1_000_000),
});

export type UsageLimits = z.infer<typeof UsageLimitsSchema>;

export async function getEffectiveUsageLimits(db: Firestore): Promise<UsageLimits> {
  const snap = await db.collection(USAGE_SETTINGS_COLLECTION).doc(USAGE_SETTINGS_DOC).get();
  if (!snap.exists) return { ...FREE_USAGE_LIMITS };
  const parsed = UsageLimitsSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : { ...FREE_USAGE_LIMITS };
}

export async function saveUsageLimits(db: Firestore, limits: UsageLimits, actorUid: string): Promise<UsageLimits> {
  const parsed = UsageLimitsSchema.parse(limits);
  await db.collection(USAGE_SETTINGS_COLLECTION).doc(USAGE_SETTINGS_DOC).set(
    {
      ...parsed,
      updatedBy: actorUid,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
  return parsed;
}

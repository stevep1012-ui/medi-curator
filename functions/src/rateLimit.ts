import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { hourBucket, nextRateLimitCount } from './rateLimitPolicy';

const DEFAULT_LIMIT = 30;

export async function enforceCentralRateLimit(
  db: Firestore,
  uid: string,
  now = new Date(),
  limit = DEFAULT_LIMIT,
): Promise<boolean> {
  const bucket = hourBucket(now);
  const ref = db.collection('rateLimits').doc(`${encodeURIComponent(uid)}:${bucket}`);
  const windowStart = new Date(now);
  windowStart.setUTCMinutes(0, 0, 0);
  const expiresAt = new Date(windowStart.getTime() + 2 * 60 * 60 * 1000);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const currentCount = snapshot.exists && typeof snapshot.data()?.count === 'number'
      ? snapshot.data()!.count as number
      : 0;
    const next = nextRateLimitCount(currentCount, limit);
    if (!next.allowed) return false;

    transaction.set(ref, {
      uid,
      count: next.count,
      windowStart: Timestamp.fromDate(windowStart),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
    return true;
  });
}

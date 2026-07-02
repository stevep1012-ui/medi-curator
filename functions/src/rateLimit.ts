import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { hourBucket, monthBucket, nextRateLimitCount } from './rateLimitPolicy';

const DEFAULT_HOURLY_LIMIT = 30;
const DEFAULT_MONTHLY_LIMIT = 30;

export async function enforceCentralRateLimit(
  db: Firestore,
  uid: string,
  now = new Date(),
  hourlyLimit = DEFAULT_HOURLY_LIMIT,
  monthlyLimit = DEFAULT_MONTHLY_LIMIT,
): Promise<boolean> {
  const encodedUid = encodeURIComponent(uid);
  const hour = hourBucket(now);
  const month = monthBucket(now);
  const hourlyRef = db.collection('rateLimits').doc(`${encodedUid}:${hour}`);
  const monthlyRef = db.collection('monthlyUsage').doc(`${encodedUid}:${month}`);
  const windowStart = new Date(now);
  windowStart.setUTCMinutes(0, 0, 0);
  const hourlyExpiresAt = new Date(windowStart.getTime() + 2 * 60 * 60 * 1000);
  const monthlyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthlyExpiresAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1));

  return db.runTransaction(async (transaction) => {
    const [hourlySnapshot, monthlySnapshot] = await Promise.all([
      transaction.get(hourlyRef),
      transaction.get(monthlyRef),
    ]);
    const hourlyCount = hourlySnapshot.exists && typeof hourlySnapshot.data()?.count === 'number'
      ? hourlySnapshot.data()!.count as number
      : 0;
    const monthlyCount = monthlySnapshot.exists && typeof monthlySnapshot.data()?.count === 'number'
      ? monthlySnapshot.data()!.count as number
      : 0;
    const nextHourly = nextRateLimitCount(hourlyCount, hourlyLimit);
    const nextMonthly = nextRateLimitCount(monthlyCount, monthlyLimit);
    if (!nextHourly.allowed || !nextMonthly.allowed) return false;

    transaction.set(hourlyRef, {
      uid,
      count: nextHourly.count,
      windowStart: Timestamp.fromDate(windowStart),
      expiresAt: Timestamp.fromDate(hourlyExpiresAt),
      limit: hourlyLimit,
    });
    transaction.set(monthlyRef, {
      uid,
      count: nextMonthly.count,
      month,
      windowStart: Timestamp.fromDate(monthlyStart),
      expiresAt: Timestamp.fromDate(monthlyExpiresAt),
      limit: monthlyLimit,
    });
    return true;
  });
}

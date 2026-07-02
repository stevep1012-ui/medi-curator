export function hourBucket(now: Date): string {
  return now.toISOString().slice(0, 13).replaceAll('-', '').replace('T', '');
}

export function monthBucket(now: Date): string {
  return now.toISOString().slice(0, 7).replaceAll('-', '');
}

export function nextRateLimitCount(
  currentCount: number,
  limit: number,
): { allowed: boolean; count: number } {
  if (currentCount >= limit) return { allowed: false, count: currentCount };
  return { allowed: true, count: currentCount + 1 };
}

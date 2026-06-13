import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hourBucket, nextRateLimitCount } from '../../functions/src/rateLimitPolicy';

describe('central rate limit', () => {
  it('uses a stable UTC hour bucket', () => {
    expect(hourBucket(new Date('2026-06-08T09:59:59.000Z'))).toBe('2026060809');
    expect(hourBucket(new Date('2026-06-08T10:00:00.000Z'))).toBe('2026060810');
  });

  it('allows counts through the configured limit', () => {
    expect(nextRateLimitCount(29, 30)).toEqual({ allowed: true, count: 30 });
  });

  it('blocks without incrementing after the limit', () => {
    expect(nextRateLimitCount(30, 30)).toEqual({ allowed: false, count: 30 });
  });

  it('stores only quota metadata, not request health data', () => {
    const source = readFileSync(resolve(process.cwd(), 'functions/src/rateLimit.ts'), 'utf8');
    expect(source).toContain("collection('rateLimits')");
    expect(source).not.toContain('symptoms');
    expect(source).not.toContain('currentMedications');
  });
});

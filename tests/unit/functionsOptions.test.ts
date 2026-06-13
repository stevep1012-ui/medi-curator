import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const indexSource = readFileSync(
  resolve(process.cwd(), 'functions/src/index.ts'),
  'utf8',
);
const dsrSource = readFileSync(
  resolve(process.cwd(), 'functions/src/dsr.ts'),
  'utf8',
);

describe('Cloud Functions runtime options', () => {
  it('sets global options once and configures DSR max instances locally', () => {
    const combined = `${indexSource}\n${dsrSource}`;
    expect(combined.match(/setGlobalOptions\(/g)).toHaveLength(1);
    expect(dsrSource).toContain('maxInstances: 5');
  });

  it('rate limits authenticated users by uid after consent verification', () => {
    const authIndex = indexSource.indexOf('const caller = await requireAuthenticatedConsent(req)');
    const rateIndex = indexSource.indexOf('await enforceCentralRateLimit(db, caller.uid)');

    expect(rateIndex).toBeGreaterThan(authIndex);
    expect(indexSource).not.toContain('const RATE = new Map');
  });

  it('verifies App Check before authentication and consent', () => {
    const appCheckIndex = indexSource.indexOf('await requireAppCheck(req)');
    const authIndex = indexSource.indexOf('await requireAuthenticatedConsent(req)');

    expect(appCheckIndex).toBeGreaterThan(-1);
    expect(appCheckIndex).toBeLessThan(authIndex);
    expect(indexSource).toContain("req.headers['x-firebase-appcheck']");
  });
});

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
// App Check / 인증+동의 가드의 본문은 shared.ts 한 곳에만 있고 index.ts 는 호출만 한다.
// 그래서 "호출 순서" 는 index.ts 에서, "실제로 헤더를 읽는지" 는 shared.ts 에서 확인한다.
const sharedSource = readFileSync(
  resolve(process.cwd(), 'functions/src/shared.ts'),
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
    expect(sharedSource).toContain("req.headers['x-firebase-appcheck']");
  });

  it('가드를 shared.ts 에만 정의한다 (curate 사본 재생성 방지)', () => {
    // F1 처럼 사본이 한쪽만 갱신되는 사고를 막는다. index.ts 는 import 해 쓰기만 해야 한다.
    expect(indexSource).not.toMatch(/(async )?function requireAppCheck/);
    expect(indexSource).not.toMatch(/(async )?function requireAuthenticatedConsent/);
    expect(indexSource).not.toMatch(/function violatesForbidden/);
    expect(indexSource).toMatch(/from '\.\/shared'/);
  });
});

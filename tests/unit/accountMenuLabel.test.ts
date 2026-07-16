import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/app/components/Chrome.tsx'), 'utf8');

describe('AccountMenu label', () => {
  it('does not show the generic account label on the signed-in account chip', () => {
    expect(source).toContain('const visibleName =');
    expect(source).toContain('displayName?.trim()');
    expect(source).toContain('emailName || "닉네임 설정"');
    expect(source).not.toContain('{displayName || ac.account}</span>');
  });
});

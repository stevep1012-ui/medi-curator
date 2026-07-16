import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const toolNavSource = readFileSync(resolve(process.cwd(), 'src/app/components/menu-views.tsx'), 'utf8');
const nextStepsSource = readFileSync(resolve(process.cwd(), 'src/app/components/NextSteps.tsx'), 'utf8');

describe('commercial navigation flow', () => {
  it('offers direct tool access from tool screens instead of only sequential arrows', () => {
    expect(toolNavSource).toContain('MENU_ORDER.map');
    expect(toolNavSource).toContain('aria-current');
    expect(toolNavSource).not.toContain('const prev =');
    expect(toolNavSource).not.toContain('const next =');
  });

  it('does not spam privacy as a generic next-step CTA on every feature screen', () => {
    expect(nextStepsSource).not.toContain('["privacy", "privacy"]');
    expect(nextStepsSource).toContain('["toHistory", "history"]');
    expect(nextStepsSource).toContain('["toMeds", "mymeds"]');
  });
});

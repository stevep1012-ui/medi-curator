import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

describe('Vite dev proxy', () => {
  it('routes every Firebase Hosting API rewrite used by the browser to the local Functions emulator', () => {
    const requiredRoutes = [
      ['/api/curate', 'curate'],
      ['/api/interaction', 'interaction'],
      ['/api/pairing', 'pairing'],
      ['/api/recognize-med', 'recognizeMed'],
      ['/api/pharmacies', 'pharmacies'],
    ] as const;

    for (const [browserPath, functionId] of requiredRoutes) {
      expect(source).toContain(`'${browserPath}'`);
      expect(source).toContain(`/${functionId}`);
    }
  });
});

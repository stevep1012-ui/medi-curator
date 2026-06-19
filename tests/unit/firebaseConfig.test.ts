import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/firebase.ts'), 'utf8');

describe('Firebase client configuration', () => {
  it('loads Firebase configuration at runtime instead of embedding Vite keys', () => {
    expect(source).toContain("'/__/firebase/init.json'");
    expect(source).not.toContain('VITE_FIREBASE_API_KEY');
  });

  it('initializes reCAPTCHA v3 App Check from a public site key', () => {
    expect(source).toContain('ReCaptchaV3Provider');
    expect(source).toContain('initializeAppCheck');
    expect(source).toContain('VITE_RECAPTCHA_ENTERPRISE_SITE_KEY');
    expect(source).toContain('getAppCheckToken');
  });
});

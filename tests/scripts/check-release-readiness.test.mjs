import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReleaseReadiness } from '../../scripts/check-release-readiness.mjs';

const validProfile = {
  businessName: 'Medi Curator Co.',
  representative: 'Representative Name',
  businessAddress: 'Seoul, Republic of Korea',
  privacyOfficer: 'Privacy Officer',
  privacyEmail: 'privacy@example.com',
};

test('rejects unresolved business placeholders', () => {
  const errors = validateReleaseReadiness(
    { ...validProfile, businessName: '[출시 전 확정 필요]' },
    { VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: 'site-key' },
    'mediq-kr-2026',
  );
  assert.ok(errors.some((error) => error.includes('businessName')));
});

test('rejects a missing App Check site key', () => {
  const errors = validateReleaseReadiness(validProfile, {}, 'mediq-kr-2026');
  assert.ok(errors.some((error) => error.includes('VITE_RECAPTCHA_ENTERPRISE_SITE_KEY')));
});

test('rejects a placeholder Firebase project id', () => {
  const errors = validateReleaseReadiness(
    validProfile,
    { VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: 'site-key' },
    'REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID',
  );
  assert.ok(errors.some((error) => error.includes('Firebase project ID')));
});

test('accepts complete production configuration', () => {
  assert.deepEqual(
    validateReleaseReadiness(
      validProfile,
      { VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: 'site-key' },
      'mediq-kr-2026',
    ),
    [],
  );
});

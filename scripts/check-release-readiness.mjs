import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const REQUIRED_BUSINESS_FIELDS = [
  'businessName',
  'representative',
  'businessAddress',
  'privacyOfficer',
  'privacyEmail',
  // 약관·개인정보처리방침·FAQ 화면이 이 값들을 그대로 렌더한다(P0-007). 예전에는
  // Legal.tsx 에 연락처가 하드코딩돼 있어, 게이트가 PASS 여도 화면에는 위약 연락처가
  // 그대로 나갈 수 있었다.
  'supportEmail',
  'supportPhone',
];

function unresolved(value) {
  return typeof value !== 'string'
    || value.trim() === ''
    || value.includes('[출시 전 확정 필요]')
    || value.includes('REPLACE_WITH_')
    || value.startsWith('your_');
}

export function validateReleaseReadiness(profile, env, firebaseProjectId) {
  const errors = [];

  for (const field of REQUIRED_BUSINESS_FIELDS) {
    if (unresolved(profile?.[field])) {
      errors.push(`${field}: 실제 사업자 정보를 입력해야 합니다.`);
    }
  }

  if (unresolved(env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY)) {
    errors.push('VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: production App Check site key가 필요합니다.');
  }

  if (unresolved(firebaseProjectId) || firebaseProjectId === 'demo-medi-curator') {
    errors.push('Firebase project ID: 실제 production 프로젝트를 지정해야 합니다.');
  }

  return errors;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function runReleaseReadinessCheck({
  profilePath = 'config/release-profile.json',
  firebaseRcPath = '.firebaserc',
  env = process.env,
} = {}) {
  const profile = readJson(profilePath);
  const firebaseRc = readJson(firebaseRcPath);
  const projectId = firebaseRc?.projects?.default;
  const errors = validateReleaseReadiness(profile, env, projectId);

  if (errors.length > 0) {
    console.error('RELEASE READINESS: BLOCK');
    errors.forEach((error) => console.error(`- ${error}`));
    return 1;
  }

  console.log('RELEASE READINESS: PASS');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runReleaseReadinessCheck();
}

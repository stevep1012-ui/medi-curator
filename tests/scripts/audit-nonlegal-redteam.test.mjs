import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { evaluateNonLegalRedteam } from '../../scripts/audit-nonlegal-redteam.mjs';

function fixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-redteam-'));
  const files = {
    'functions/src/aiTools.ts': `
      export const recognizeMed = onRequest({}, async (req, res) => {
        await requireAppCheck(req);
        const caller = await requireAuthenticatedConsent(req);
        if (!caller.ok) res.status(403).json({ code: 'CONSENT_REQUIRED' });
        if (!req.headers.authorization) res.status(401).json({ code: 'NO_TOKEN' });
        const validated = RecognizedMed.safeParse(outcome.candidate);
        const i = InteractionAIResult.safeParse(outcome.candidate);
        const p = PairingAIResult.safeParse(outcome.candidate);
        const forbidden = violatesForbidden(JSON.stringify(validated.data));
        logger.info('recognize.ok', { traceId, recognized: validated.data.recognized });
      });
    `,
    'functions/src/shared.ts': `
      export function requireAuthenticatedConsent(req) {
        if (!req.headers.authorization) return { ok: false, code: 'NO_TOKEN' };
        return { ok: false, code: 'CONSENT_REQUIRED' };
      }
      fetch(url, { body: JSON.stringify({ generationConfig: { responseMimeType: 'application/json' } }) });
      return { ok: true, candidate: JSON.parse(match[0]) };
    `,
    'src/app/components/MedCapture.tsx': `
      <input type="file" accept="image/*" capture="environment" />
      <button>카메라</button><button>사진 선택</button>
      const { base64, mimeType } = await readAsBase64(file);
    `,
    'src/services/medStore.ts': `
      const KEY = 'medi-curator:meds:';
      export function saveMed(uid, med) { localStorage.setItem(KEY + uid, JSON.stringify([{ name: med.name }])); }
      export function loadSavedMedNames(uid) { return []; }
    `,
    'src/lib/emergency.ts': `
      export const MENTAL_KEYWORDS = ['자살', '자해', 'suicide', 'self-harm'];
      export const HOTLINES = { mental: [{ tel: '109' }, { tel: '1577-0199' }], physical: [{ tel: '119' }] };
    `,
    'src/app/page.tsx': 'loadSavedMedNames(uid); <button>내 목록에 저장</button>',
    'src/app/components/SymptomAnalysis.tsx': 'loadSavedMedNames(uid); save to my list',
    'src/app/components/InteractionCheck.tsx': 'loadSavedMedNames(uid); 저장',
    ...overrides,
  };
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test('passes non-legal red-team checks for the expected architecture', () => {
  const report = evaluateNonLegalRedteam(fixture());
  assert.equal(report.verdict, 'PASS');
  assert.equal(report.results.every((r) => r.verdict === 'PASS'), true);
});

test('blocks when recognizeMed lacks authenticated consent', () => {
  const report = evaluateNonLegalRedteam(fixture({
    'functions/src/aiTools.ts': 'export const recognizeMed = onRequest({}, async (req, res) => { await requireAppCheck(req); });',
  }));
  const finding = report.results.find((r) => r.id === 'RT-NL-001');
  assert.equal(finding?.verdict, 'BLOCK');
  assert.equal(report.verdict, 'BLOCK');
});

test('blocks when original image/base64 is persisted locally', () => {
  const report = evaluateNonLegalRedteam(fixture({
    'src/app/components/Bad.tsx': "localStorage.setItem('photo', imageBase64);",
  }));
  const finding = report.results.find((r) => r.id === 'RT-NL-002');
  assert.equal(finding?.verdict, 'BLOCK');
  assert.equal(report.verdict, 'BLOCK');
});

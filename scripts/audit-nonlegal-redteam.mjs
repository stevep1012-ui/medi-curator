#!/usr/bin/env node
// Non-legal red-team audit for medi-curator.
// Scope: safety/product-truth/runtime-risk checks only. Legal, copyright,
// licensing, advertising-law, PIPA legal interpretation, and SaMD classification
// are intentionally excluded and remain HOLD for human/legal review.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROOT = process.cwd();

const CHECKS = [
  {
    id: 'RT-NL-001',
    area: 'med-photo-auth-consent',
    severity: 'BLOCK',
    description: 'Prescription/medication photo recognition must require auth + sensitive-health consent before server OCR/vision.',
    evidence: (files) => allOf(files.functionsAiTools, [
      /export const recognizeMed\s*=\s*onRequest/,
      /requireAppCheck\(req\)/,
      /requireAuthenticatedConsent\(req\)/,
    ]) && allOf(files.shared, [/CONSENT_REQUIRED/, /NO_TOKEN/]),
  },
  {
    id: 'RT-NL-002',
    area: 'med-photo-no-original-persistence',
    severity: 'BLOCK',
    description: 'Original photos/base64 must not be persisted in localStorage/Firestore/logs; only user-confirmed recognized text may be saved.',
    evidence: (files) => {
      const source = files.allSource;
      const localBase64Write = /localStorage\.setItem\([^\n]*(imageBase64|base64|data:image|readAsDataURL)/i.test(source);
      const firestoreImageWrite = /(setDoc|addDoc|updateDoc)\([\s\S]{0,240}(imageBase64|base64|data:image)/i.test(source);
      const loggedImage = /logger\.(info|warn|error)\([\s\S]{0,240}(imageBase64|dataBase64|base64)/i.test(files.functionsAiTools);
      return !localBase64Write && !firestoreImageWrite && !loggedImage;
    },
  },
  {
    id: 'RT-NL-003',
    area: 'med-photo-save-reuse',
    severity: 'BLOCK',
    description: 'Recognized medicine text needs an explicit user save action and must be reusable in later symptom/safety-check flows.',
    evidence: (files) => allOf(files.medStore, [/(saveMed|addMed)/, /(loadSavedMedNames|medNamesText)/, /medi-curator:meds:/])
      && /내 목록에 저장|save to my list|저장/.test(files.pageAndTools)
      && /(loadSavedMedNames|medNamesText)/.test(files.pageAndTools),
  },
  {
    id: 'RT-NL-004',
    area: 'camera-library-truth',
    severity: 'WATCH',
    description: 'Mobile capture should expose separate camera and photo-library paths without claiming unsupported hardware scanning.',
    evidence: (files) => allOf(files.medCapture, [
      /capture="environment"/,
      /사진 선택|Photo library/,
      /카메라|Camera/,
      /accept="image\/\*"/,
    ]),
  },
  {
    id: 'RT-NL-005',
    area: 'schema-forbidden-guard',
    severity: 'BLOCK',
    description: 'AI/vision outputs must be schema-validated and filtered for diagnosis/prescription/cure claims before display.',
    evidence: (files) => allOf(files.functionsAiTools, [
      /RecognizedMed\.safeParse\(outcome\.candidate\)/,
      /InteractionAIResult\.safeParse\(outcome\.candidate\)/,
      /PairingAIResult\.safeParse\(outcome\.candidate\)/,
      /violatesForbidden\(JSON\.stringify\(validated\.data\)\)/,
    ]),
  },
  {
    id: 'RT-NL-006',
    area: 'crisis-safety',
    severity: 'WATCH',
    description: 'Self-harm/suicide keywords should surface mental-health crisis numbers immediately, not only generic 119.',
    evidence: (files) => /자살|자해|suicide|self-harm/.test(files.emergency)
      && /(109|1393)/.test(files.emergency)
      && /1577-0199/.test(files.emergency)
      && /119/.test(files.emergency),
  },
  {
    id: 'RT-NL-007',
    area: 'prompt-injection-shape',
    severity: 'WATCH',
    description: 'LLM calls should force JSON-only output and avoid rendering free-form model text directly.',
    evidence: (files) => /responseMimeType:\s*'application\/json'/.test(files.shared)
      && /JSON\.parse\(match\[0\]\)/.test(files.shared)
      && /safeParse/.test(files.functionsAiTools),
  },
];

function readMaybe(root, rel) {
  const file = path.join(root, rel);
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function walkText(root, rels) {
  let out = '';
  for (const rel of rels) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'lib') continue;
        const child = path.join(rel, entry.name);
        if (entry.isDirectory()) out += walkText(root, [child]);
        else if (/\.(ts|tsx|js|mjs|json|md)$/.test(entry.name)) out += `\n--- ${child} ---\n${readMaybe(root, child)}`;
      }
    } else if (/\.(ts|tsx|js|mjs|json|md)$/.test(abs)) {
      out += `\n--- ${rel} ---\n${readMaybe(root, rel)}`;
    }
  }
  return out;
}

function allOf(text, patterns) {
  return patterns.every((pattern) => pattern.test(text));
}

function collectFiles(root = DEFAULT_ROOT) {
  return {
    functionsAiTools: readMaybe(root, 'functions/src/aiTools.ts'),
    shared: readMaybe(root, 'functions/src/shared.ts'),
    medCapture: readMaybe(root, 'src/app/components/MedCapture.tsx'),
    medStore: readMaybe(root, 'src/services/medStore.ts'),
    emergency: readMaybe(root, 'src/lib/emergency.ts') + readMaybe(root, 'src/components/SymptomInput.tsx'),
    pageAndTools: [
      'src/app/page.tsx',
      'src/app/components/SymptomAnalysis.tsx',
      'src/app/components/InteractionCheck.tsx',
      'src/app/components/MedCapture.tsx',
    ].map((rel) => readMaybe(root, rel)).join('\n'),
    allSource: walkText(root, ['src', 'functions/src']),
  };
}

export function evaluateNonLegalRedteam(root = DEFAULT_ROOT) {
  const files = collectFiles(root);
  const results = CHECKS.map((check) => {
    const pass = Boolean(check.evidence(files));
    return { ...check, verdict: pass ? 'PASS' : check.severity };
  });
  const verdict = results.some((r) => r.verdict === 'BLOCK')
    ? 'BLOCK'
    : results.some((r) => r.verdict === 'WATCH')
      ? 'WATCH'
      : 'PASS';
  return { verdict, results };
}

export function formatNonLegalRedteamReport(report) {
  const lines = [
    `NONLEGAL_REDTEAM: ${report.verdict}`,
    '',
    '| ID | Area | Verdict | Check |',
    '|---|---|---|---|',
  ];
  for (const r of report.results) {
    lines.push(`| ${r.id} | ${r.area} | ${r.verdict} | ${r.description} |`);
  }
  lines.push('', 'Scope exclusions: legal/copyright/licensing judgments, advertising-law analysis, PIPA legal interpretation, and SaMD classification are intentionally not evaluated by this command.');
  return lines.join('\n');
}

export function runNonLegalRedteam({ root = DEFAULT_ROOT } = {}) {
  const report = evaluateNonLegalRedteam(root);
  console.log(formatNonLegalRedteamReport(report));
  return report.verdict === 'BLOCK' ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rootArg = process.argv[2] || DEFAULT_ROOT;
  process.exitCode = runNonLegalRedteam({ root: rootArg });
}

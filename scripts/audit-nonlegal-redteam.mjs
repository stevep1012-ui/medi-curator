#!/usr/bin/env node
// Non-legal red-team audit for medi-curator.
// Scope: safety/product-truth/runtime-risk checks only. Legal, copyright,
// licensing, advertising-law, PIPA legal interpretation, and SaMD classification
// are intentionally excluded and remain HOLD for human/legal review.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROOT = process.cwd();
const SCOPE_EXCLUSIONS = [
  'legal/copyright/licensing judgments',
  'advertising-law analysis',
  'pharmacist/medical-service/medical-device law interpretation',
  'PIPA legal interpretation',
  'SaMD classification',
];
const LEGAL_HOLD_ITEMS = [
  'Production legal wording and policy interpretation',
  'Business/operator identity and privacy-officer correctness',
  'Advertising-law / pharmacy-referral interpretation',
  'SaMD / medical-device regulatory classification',
];

const CHECKS = [
  {
    id: 'RT-NL-001',
    area: 'med-photo-auth-consent',
    severity: 'BLOCK',
    owner: 'api-engineer + privacy-officer',
    description: 'Prescription/medication photo recognition must require auth + sensitive-health consent before server OCR/vision.',
    passEvidence: '`recognizeMed` calls App Check and authenticated-consent guards; shared guard exposes NO_TOKEN/CONSENT_REQUIRED paths.',
    fix: 'Gate the photo/vision endpoint before reading the image payload; keep a clear pre-picker UI error for signed-out or non-consented users.',
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
    owner: 'security-auditor + frontend-architect',
    description: 'Original photos/base64 must not be persisted in localStorage/Firestore/logs; only user-confirmed recognized text may be saved.',
    passEvidence: 'Static source scan found no localStorage/Firestore/logger persistence of original image/base64 payloads.',
    fix: 'Remove any original-photo/base64 persistence; store only recognized text after explicit user confirmation.',
    evidence: (files) => {
      const source = files.allSource;
      const localBase64Write = /localStorage\.setItem\([^\n]*(imageBase64|base64|data:image|readAsDataURL)/i.test(source);
      const firestoreImageWrite = /(setDoc|addDoc|updateDoc)\([\s\S]{0,240}(imageBase64|base64|data:image)/i.test(source);
      const loggedImage = /logger\.(info|warn|error)\([\s\S]{0,240}(imageBase64|dataBase64|base64)/i.test(files.functionsAiTools + files.shared);
      return !localBase64Write && !firestoreImageWrite && !loggedImage;
    },
  },
  {
    id: 'RT-NL-003',
    area: 'med-photo-save-reuse',
    severity: 'BLOCK',
    owner: 'frontend-architect + qa-engineer',
    description: 'Recognized medicine text needs an explicit user save action and must be reusable in later symptom/safety-check flows.',
    passEvidence: 'Medication local store exposes save/load helpers; tool screens include an explicit save action and preload saved medication names.',
    fix: 'Add an explicit “내 목록에 저장 / Save to my list” action and preload saved names in symptom analysis and interaction/safety-check flows.',
    evidence: (files) => allOf(files.medStore, [/(saveMed|addMed)/, /(loadSavedMedNames|medNamesText)/, /medi-curator:meds:/])
      && /내 목록에 저장|save to my list|저장/.test(files.pageAndTools)
      && /(loadSavedMedNames|medNamesText)/.test(files.pageAndTools),
  },
  {
    id: 'RT-NL-004',
    area: 'camera-library-truth',
    severity: 'WATCH',
    owner: 'ux-designer + frontend-architect',
    description: 'Mobile capture should expose separate camera and photo-library paths without claiming unsupported live hardware scanning.',
    passEvidence: 'Medication capture has separate camera and photo-library file inputs with mobile capture hint and image accept filter.',
    fix: 'Expose separate camera/library controls; avoid “live scan” or unsupported real-time camera claims unless code actually uses MediaDevices/getUserMedia.',
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
    owner: 'api-engineer + medical-reviewer',
    description: 'AI/vision outputs must be schema-validated and filtered for diagnosis/prescription/cure claims before display.',
    passEvidence: 'Interaction, pairing, and recognition endpoints parse with Zod and run forbidden-phrase guard before success response.',
    fix: 'Validate every model response with the endpoint schema and reject forbidden diagnosis/prescription/cure claims before returning data to UI.',
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
    owner: 'medical-reviewer + frontend-architect',
    description: 'Self-harm/suicide keywords should surface mental-health crisis numbers immediately, not only generic 119.',
    passEvidence: 'Shared emergency module includes self-harm/suicide keywords and mental/physical emergency contacts.',
    fix: 'Restore immediate client-side crisis detection with mental-health contacts plus physical emergency contact.',
    evidence: (files) => /자살|자해|suicide|self-harm/.test(files.emergency)
      && /(109|1393)/.test(files.emergency)
      && /1577-0199/.test(files.emergency)
      && /119/.test(files.emergency),
  },
  {
    id: 'RT-NL-007',
    area: 'prompt-injection-shape',
    severity: 'WATCH',
    owner: 'api-engineer + security-auditor',
    description: 'LLM calls should force JSON-only output and avoid rendering free-form model text directly.',
    passEvidence: 'Gemini proxy requests JSON output, extracts/parses JSON, and endpoint schemas validate the parsed object.',
    fix: 'Keep model responses structured; never render raw model prose from safety-critical endpoints.',
    evidence: (files) => /responseMimeType:\s*'application\/json'/.test(files.shared)
      && /JSON\.parse\(match\[0\]\)/.test(files.shared)
      && /safeParse/.test(files.functionsAiTools),
  },
  {
    id: 'RT-NL-008',
    area: 'pharmacy-location-truth',
    severity: 'WATCH',
    owner: 'frontend-architect + runtime-reliability-auditor',
    description: 'Pharmacy/location UI should match implementation: browser geolocation plus server-side Kakao proxy, not fake map/sample data claims in the active component.',
    passEvidence: 'Active pharmacy component uses browser geolocation, calls the pharmacy service, handles errors, and renders returned items without demo/sample labels.',
    fix: 'Align active pharmacy copy with implementation; remove active sample/demo claims or disable real-location CTA until backend is wired.',
    evidence: (files) => allOf(files.pharmacyFinder + files.pharmacyService + files.pharmaciesFn, [
      /navigator\.geolocation\.getCurrentPosition/,
      /searchPharmacies\(/,
      /\/api\/pharmacies/,
      /KAKAO_REST_KEY/,
    ]) && !/(샘플 데이터|화면 예시|mock)/i.test(files.pharmacyFinder),
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function collectFiles(root = DEFAULT_ROOT) {
  return {
    functionsAiTools: readMaybe(root, 'functions/src/aiTools.ts'),
    shared: readMaybe(root, 'functions/src/shared.ts'),
    medCapture: readMaybe(root, 'src/app/components/MedCapture.tsx'),
    medStore: readMaybe(root, 'src/services/medStore.ts'),
    emergency: readMaybe(root, 'src/lib/emergency.ts') + readMaybe(root, 'src/components/SymptomInput.tsx'),
    pharmacyFinder: readMaybe(root, 'src/app/components/PharmacyFinder.tsx'),
    pharmacyService: readMaybe(root, 'src/services/pharmacyService.ts'),
    pharmaciesFn: readMaybe(root, 'functions/src/pharmacies.ts'),
    pageAndTools: [
      'src/app/page.tsx',
      'src/app/components/MyMeds.tsx',
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
    return {
      id: check.id,
      area: check.area,
      severity: check.severity,
      owner: check.owner,
      description: check.description,
      evidence: pass ? check.passEvidence : check.fix,
      verdict: pass ? 'PASS' : check.severity,
    };
  });
  const verdict = results.some((r) => r.verdict === 'BLOCK')
    ? 'BLOCK'
    : results.some((r) => r.verdict === 'WATCH')
      ? 'WATCH'
      : 'PASS';
  return {
    verdict,
    generatedAt: new Date().toISOString(),
    scopeExclusions: SCOPE_EXCLUSIONS,
    legalHoldItems: LEGAL_HOLD_ITEMS,
    results,
  };
}

export function formatNonLegalRedteamReport(report, { detailed = false } = {}) {
  const lines = [
    `NONLEGAL_REDTEAM: ${report.verdict}`,
    '',
    '| ID | Area | Verdict | Check |',
    '|---|---|---|---|',
  ];
  for (const r of report.results) {
    lines.push(`| ${r.id} | ${r.area} | ${r.verdict} | ${r.description} |`);
  }
  lines.push('', `Scope exclusions: ${report.scopeExclusions.join('; ')} are intentionally not evaluated by this command.`);
  if (detailed) {
    lines.push('', 'LEGAL_HOLD items:', ...report.legalHoldItems.map((item) => `- ${item}`));
  }
  return lines.join('\n');
}

export function formatMarkdownReport(report) {
  const lines = [
    '# Non-Legal Red-Team Report',
    '',
    '## Date',
    `- ${report.generatedAt.slice(0, 10)}`,
    '',
    '## Scope',
    '- Included: product safety, harmful-use paths, youth/vulnerable-user risk, emergency-priority handling, prompt-injection surface, prescription/medication photo-retention behavior, camera/photo/map feature truthfulness, and runtime guard coverage.',
    `- Excluded / LEGAL_HOLD: ${report.scopeExclusions.join('; ')}.`,
    '',
    '## Automated Check',
    '- Command: `npm run audit:redteam:nonlegal`',
    `- Result: ${report.verdict}`,
    '',
    '| ID | Area | Verdict | Evidence / Fix | Owner |',
    '|---|---|---|---|---|',
  ];
  for (const r of report.results) {
    lines.push(`| ${r.id} | ${r.area} | ${r.verdict} | ${r.evidence} | ${r.owner} |`);
  }
  const open = report.results.filter((r) => r.verdict !== 'PASS');
  lines.push('', '## Remediation Backlog');
  if (open.length === 0) {
    lines.push('- No non-legal BLOCK/WATCH item opened by the automated check.');
  } else {
    for (const r of open) lines.push(`- [ ] ${r.id} (${r.verdict}) — ${r.evidence} Owner: ${r.owner}.`);
  }
  lines.push('', '## LEGAL_HOLD Items');
  for (const item of report.legalHoldItems) lines.push(`- ${item}`);
  lines.push('', '## Re-test Plan');
  lines.push('- Run `npm run audit:redteam:nonlegal` on every change touching camera/photo/OCR/vision, medication local storage, emergency handling, pharmacy/map/geolocation, or AI-output code paths.');
  lines.push('- Run `/audit-legal` separately only when legal review resumes.');
  lines.push('', '## Exit Criteria');
  lines.push('- Non-legal automated verdict is PASS.');
  lines.push('- No active BLOCK/WATCH item remains outside LEGAL_HOLD.');
  return `${lines.join('\n')}\n`;
}

function defaultReportPath(root) {
  return path.join(root, 'docs', 'reviews', `REDTEAM-NONLEGAL-${todayIso()}.md`);
}

function parseArgs(argv) {
  const opts = { root: DEFAULT_ROOT, writeReport: false, reportPath: null, json: false };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') opts.root = argv[++i] || DEFAULT_ROOT;
    else if (arg === '--write-report') opts.writeReport = true;
    else if (arg === '--report') {
      opts.writeReport = true;
      opts.reportPath = argv[++i] || null;
    } else if (arg === '--json') opts.json = true;
    else positional.push(arg);
  }
  if (positional[0]) opts.root = positional[0];
  return opts;
}

export function runNonLegalRedteam({ root = DEFAULT_ROOT, writeReport = false, reportPath = null, json = false } = {}) {
  const report = evaluateNonLegalRedteam(root);
  if (writeReport) {
    const out = reportPath ? path.resolve(root, reportPath) : defaultReportPath(root);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, formatMarkdownReport(report));
    report.reportPath = out;
  }
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatNonLegalRedteamReport(report, { detailed: true }));
    if (report.reportPath) console.log(`\nReport written: ${report.reportPath}`);
  }
  return report.verdict === 'BLOCK' ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runNonLegalRedteam(parseArgs(process.argv.slice(2)));
}

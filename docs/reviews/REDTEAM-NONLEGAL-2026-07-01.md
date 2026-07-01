# Non-Legal Red-Team Report

## Date
- 2026-07-01

## Scope
- Included: product safety, harmful-use paths, youth/vulnerable-user risk, emergency-priority handling, prompt-injection surface, prescription/medication photo-retention behavior, camera/photo/map feature truthfulness, and runtime guard coverage.
- Excluded / LEGAL_HOLD: legal/copyright/licensing judgments; advertising-law analysis; pharmacist/medical-service/medical-device law interpretation; PIPA legal interpretation; SaMD classification.

## Automated Check
- Command: `npm run audit:redteam:nonlegal`
- Result: PASS

| ID | Area | Verdict | Evidence / Fix | Owner |
|---|---|---|---|---|
| RT-NL-001 | med-photo-auth-consent | PASS | `recognizeMed` calls App Check and authenticated-consent guards; shared guard exposes NO_TOKEN/CONSENT_REQUIRED paths. | api-engineer + privacy-officer |
| RT-NL-002 | med-photo-no-original-persistence | PASS | Static source scan found no localStorage/Firestore/logger persistence of original image/base64 payloads. | security-auditor + frontend-architect |
| RT-NL-003 | med-photo-save-reuse | PASS | Medication local store exposes save/load helpers; tool screens include an explicit save action and preload saved medication names. | frontend-architect + qa-engineer |
| RT-NL-004 | camera-library-truth | PASS | Medication capture has separate camera and photo-library file inputs with mobile capture hint and image accept filter. | ux-designer + frontend-architect |
| RT-NL-005 | schema-forbidden-guard | PASS | Interaction, pairing, and recognition endpoints parse with Zod and run forbidden-phrase guard before success response. | api-engineer + medical-reviewer |
| RT-NL-006 | crisis-safety | PASS | Shared emergency module includes self-harm/suicide keywords and mental/physical emergency contacts. | medical-reviewer + frontend-architect |
| RT-NL-007 | prompt-injection-shape | PASS | Gemini proxy requests JSON output, extracts/parses JSON, and endpoint schemas validate the parsed object. | api-engineer + security-auditor |
| RT-NL-008 | pharmacy-location-truth | PASS | Active pharmacy component uses browser geolocation, calls the pharmacy service, handles errors, and renders returned items without demo/sample labels. | frontend-architect + runtime-reliability-auditor |

## Remediation Backlog
- No non-legal BLOCK/WATCH item opened by the automated check.

## LEGAL_HOLD Items
- Production legal wording and policy interpretation
- Business/operator identity and privacy-officer correctness
- Advertising-law / pharmacy-referral interpretation
- SaMD / medical-device regulatory classification

## Re-test Plan
- Run `npm run audit:redteam:nonlegal` on every change touching camera/photo/OCR/vision, medication local storage, emergency handling, pharmacy/map/geolocation, or AI-output code paths.
- Run `/audit-legal` separately only when legal review resumes.

## Exit Criteria
- Non-legal automated verdict is PASS.
- No active BLOCK/WATCH item remains outside LEGAL_HOLD.

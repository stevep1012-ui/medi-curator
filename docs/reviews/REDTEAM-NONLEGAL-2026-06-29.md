# Non-Legal Red-Team Report

## Date
- 2026-06-29

## Scope
- Included: product safety, harmful-use paths, youth/vulnerable-user risk, emergency-priority handling, prompt-injection surface, prescription/medication photo-retention behavior, camera/photo feature truthfulness, and runtime guard coverage.
- Excluded / LEGAL_HOLD: legal/copyright/licensing judgments, advertising-law analysis, pharmacist/medical-service/medical-device law analysis, SaMD classification, and PIPA legal interpretation.

## Automated Check
- Command: `npm run audit:redteam:nonlegal`
- Result: PASS

| ID | Area | Verdict | Evidence |
|---|---|---|---|
| RT-NL-001 | med-photo-auth-consent | PASS | `recognizeMed` uses App Check plus authenticated consent guard before vision processing. |
| RT-NL-002 | med-photo-no-original-persistence | PASS | Static scan found no localStorage/Firestore/logger persistence of original image/base64 payloads. |
| RT-NL-003 | med-photo-save-reuse | PASS | Recognized text can be explicitly saved to local medication storage and reused through symptom/safety-check flows. |
| RT-NL-004 | camera-library-truth | PASS | Separate camera and photo-library file inputs exist; no unsupported live hardware-scanning claim was required for PASS. |
| RT-NL-005 | schema-forbidden-guard | PASS | AI/vision outputs are Zod-validated and passed through forbidden-phrase guard before success response. |
| RT-NL-006 | crisis-safety | PASS | Self-harm/suicide keywords and mental/physical emergency contacts are present in the shared emergency module. |
| RT-NL-007 | prompt-injection-shape | PASS | Gemini calls request JSON output, parse JSON, and endpoint schemas validate outputs before use. |

## Remediation Backlog
- No non-legal BLOCK/WATCH item opened by the automated check.
- LEGAL_HOLD remains for production release decisions and legally sensitive wording/policy interpretation.

## Re-test Plan
- Run `npm run audit:redteam:nonlegal` on every change touching camera/photo/OCR/vision, medication local storage, emergency handling, pharmacy/map/geolocation, or AI-output code paths.
- Run `/audit-legal` separately only when legal review resumes.

## Verification
- `npm run audit:redteam:nonlegal` — PASS
- `node --test tests/scripts/audit-nonlegal-redteam.test.mjs` — PASS, 3 tests
- `npm run build` — PASS
- `npm run scan:secrets` — PASS
- `npm run scan:bundle` — PASS
- `npm run lint` — PASS
- `npm --prefix functions run build` — PASS

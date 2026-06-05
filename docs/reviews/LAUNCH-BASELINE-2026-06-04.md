# LAUNCH-BASELINE-2026-06-04

## Launch Status: HOLD

### Why
- Static, build, unit coverage, and E2E checks pass locally.
- Sensitive-health server persistence has been removed after baseline. Launch is still held by Firebase deployment evidence and legal/medical release evidence.
- Legal/medical release evidence is not complete enough for `GO`.

## P0 Blockers
| ID | Owner | Status | Evidence |
|---|---|---|---|
| P0-001 | api-engineer | PASS locally | `src/services/geminiService.ts` calls `/api/curate`; `functions/src/index.ts` uses `defineSecret('GEMINI_API_KEY')`; bundle secret scan passed. |
| P0-002 | privacy-officer | PASS locally | `src/services/symptomService.ts` stores search history only in user-device `localStorage`; `firestore.rules` denies `symptomHistory` server reads/writes. |
| P0-003 | legal-launch-lead | HOLD | OTC output remains part of `CurationResult`; pharmacy UI is separate, but formal legal memo and external review evidence are not present. |
| P0-004 | medical-reviewer | PASS locally | `SymptomInput.tsx` separates mental emergency keywords and shows `1393` + `1577-0199`; E2E emergency tests passed. |
| P0-005 | security-auditor | HOLD | `firestore.rules` exists and local rules are strict, but `.firebaserc` still contains `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID`; deployed rules evidence is missing. |
| P0-006 | api-engineer | PASS locally | Server and client both use Zod runtime validation: `CurationResult.safeParse`, `CurateResponse.safeParse`, and `CurationResult.parse`. |

## Gate Status
| Gate | Status | Evidence |
|---|---|---|
| STATIC | PASS | `npm run lint`, `npx tsc -b --noEmit`, `npm run scan:secrets`, `npm run build`, `npm run scan:bundle` passed. |
| CODE | HOLD | Automated lint/type pass; formal code-reviewer report not generated in this run. |
| SEC | HOLD | Secret scans pass; Firebase deployment, Functions secret configuration, and deployed Rules not verified. |
| PRIV | HOLD | Sensitive-health history is local-only. Formal privacy-officer review still required. |
| LEGAL | HOLD | Legal subagent structure exists; formal LEGAL-gate memo and external counsel items not completed. |
| MED | HOLD | Emergency E2E passes; full medical regression suite and OTC master verification not completed. |
| QA | PASS locally | `npm run test:coverage`: 5 files, 21 tests passed; overall lines 92.94%, services 100%, components 86.66%. `npm run test:e2e`: 4 passed. |
| RELEASE | HOLD | Missing Firebase deployment evidence and release identifiers. |

## Verification Commands
```text
npm run lint
npx tsc -b --noEmit
npm run scan:secrets
npm run build
npm --prefix functions run build
npm run scan:bundle
npm run test:coverage
npm run test:e2e
```

## Next Actions
1. P0-005: replace `.firebaserc` placeholder with the real Firebase project and verify deployed Hosting, Functions, Firestore Rules, Functions secrets, Apple provider, and Kakao OIDC provider.
2. P0-003: generate legal memo for OTC recommendation and pharmacy separation; decide whether to disable OTC names or constrain to approved MFDS master.
3. MED gate: run or build a full medical regression suite with redFlag miss-rate evidence.
4. RELEASE gate: produce rollback plan with actual Firebase release identifiers.

## Decision
Do not launch yet. Continue deployment, legal, and medical gate evidence.

# Account Data Deletion Wiring — 2026-07-07

## Scope

Continued the member/account flow after profile editing. The highest-impact gap was that the privacy screen displayed a destructive "delete all" button but it did not perform any deletion.

## Implementation

- Added `src/services/accountDataService.ts`.
  - Clears device-local saved medicines.
  - Clears device-local search-history metadata.
  - Clears device-local member-profile fallback.
  - Attempts to delete Firestore member profile at `users/{uid}/profile/main`.
  - Attempts to delete the current consent record at `users/{uid}/consents/{CONSENT_VERSION}`.
- Wired `src/app/components/PrivacySettings.tsx` delete button.
  - Requires login.
  - Shows an explicit browser confirmation.
  - Clarifies that Firebase login itself remains active.
  - Reports partial remote failure separately from local deletion success.
  - Resets in-memory member profile so the onboarding/profile setup flow reappears after deletion.
- Added `tests/unit/accountDataService.test.ts`.
  - Verifies deletion is scoped to one user and does not erase another user's local data.

## Verification

- `npm run test -- --pool=vmThreads --no-file-parallelism --maxWorkers=1` PASS
- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- Local preview HTTP check: `HTTP/1.1 200 OK`
- Browser guest smoke: privacy route renders locked login gate; console has no JS errors.

## Notes

This is data deletion, not account deletion. Full Firebase Auth account deletion still requires a reauthentication-safe flow and should be a separate account-management feature.

# LAUNCH-P0-LOCAL-HISTORY-2026-06-04

## Launch Status: HOLD

## Scope
- Search history is now stored only on the user's current device.
- Firebase Auth supports Google, Apple, and Kakao sign-in providers.
- Firestore `symptomHistory` server access is denied.

## Changes
- `src/services/symptomService.ts`: replaced Firestore CRUD with per-UID `localStorage` CRUD.
- `src/components/SearchHistory.tsx`: removed Firestore cursor dependency and uses local pagination.
- `src/components/PrivacySettings.tsx`: access/export includes local search history; erase/revoke deletes local history.
- `firestore.rules`: denies all `users/{uid}/symptomHistory` reads/writes.
- `functions/src/dsr.ts`: DSR no longer reads/deletes server `symptomHistory`.
- `src/firebase.ts`: added Apple and Kakao auth providers.
- `src/contexts/AuthProvider.tsx`: added provider-based sign-in.
- `src/components/Header.tsx` and `SearchHistory.tsx`: added Google, Apple, Kakao login buttons.
- Project docs updated to local-only health history.

## Verification
```text
npm run lint
npx tsc -b --noEmit
npm run test:coverage
npm run build
npm --prefix functions run build
npm run scan:bundle
npm run scan:secrets
npm run test:e2e
```

Result:
- 6 unit test files passed.
- 24 unit tests passed.
- 4 E2E tests passed.
- Build and secret scans passed.

## Remaining Risk
- Apple provider must be configured in Firebase Console.
- Kakao must be configured as Firebase OIDC provider ID `kakao`, used as `oidc.kakao` in code.
- `.firebaserc` still uses placeholder project ID.
- Legal/medical release memos are still required before `GO`.

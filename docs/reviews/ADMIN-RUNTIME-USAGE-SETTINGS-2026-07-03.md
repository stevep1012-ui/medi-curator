# Admin Runtime Usage Settings

## Date
- 2026-07-03

## Goal
- Continue the admin console work by making free-member usage limits operable from the admin side, instead of only changing static source files.

## Implemented

### Runtime usage settings
- Added `functions/src/usageSettings.ts`.
- AI rate limiting now reads effective limits from Firestore document:
  - collection: `adminConfig`
  - document: `usageLimits`
- If the document is missing or invalid, the server falls back to `functions/src/usageLimits.ts` defaults.

### Admin backend guard
- Added `functions/src/adminAccess.ts`.
- Admin APIs require a Firebase ID token and either:
  - Firebase custom claim `admin: true` or `superuser: true`, or
  - email allowlist in `ADMIN_SUPERUSER_EMAILS`
- This means the admin UI can exist publicly at `/admin`, but data mutation requires backend superuser enforcement.

### Admin usage settings API
- Added `functions/src/adminApi.ts`.
- Exported `adminUsageSettings` from `functions/src/index.ts`.
- Added Firebase Hosting rewrite:
  - `/api/admin/usage-settings` → `adminUsageSettings`
- Methods:
  - `GET`: returns current effective limits
  - `PATCH`: saves `hourlyAiRequests` and `monthlyAiRequests` to Firestore

### Admin UI connection
- Added `src/services/adminService.ts`.
- Updated `src/admin/AdminConsole.tsx` with a new section:
  - `무료 사용량 운영 설정`
  - hourly AI usage input
  - monthly free AI usage input
  - save button
- Without a signed-in superuser, the section is visible but save is disabled or rejected by backend.

## Operational Flow
1. Set Firebase custom claim for an operator account, e.g. `admin: true`.
2. Operator visits `/admin` and logs in.
3. Admin console calls `/api/admin/usage-settings`.
4. Saving limits writes Firestore `adminConfig/usageLimits`.
5. Normal AI endpoints read the updated values when enforcing usage.

## Verification
- `npm run lint` PASS
- `npm run build` PASS
- `npm --prefix functions run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- Browser `/admin` smoke check PASS
- Console errors: none

## Notes
- This does not expose customer health data.
- Revenue and access statistics remain placeholder UI until Analytics/Billing integrations are connected.

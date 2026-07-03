# Admin Console Entry

## Date
- 2026-07-03

## Request
- Add a separate administrator-operated area with another entry path.
- Include areas for superusers, usage, access statistics, paid users, and revenue management.

## Implemented

### Separate admin entry
- Added `/admin` SPA entry path.
- `src/main.tsx` now renders:
  - normal user app for `/`
  - admin console for `/admin`
- Firebase Hosting already rewrites unknown paths to `index.html`, so `/admin` works on preview/hosting without extra rewrite changes.

### Admin console UI
- Added `src/admin/AdminConsole.tsx`.
- Sections:
  - operator login screen
  - superuser setup notice
  - access statistics card
  - usage card
  - paid-user card
  - revenue card
  - conversion-rate card
  - superuser/free/paid user management table
  - plan/revenue management area
  - backend integration checklist

### Admin configuration
- Added `src/config/admin.ts`.
- Central place for:
  - admin entry path
  - superuser email allowlist
  - setup hint
  - admin snapshot placeholders
  - revenue plan placeholders

## Current Security Boundary
- This is an admin shell and operational entry point.
- It does not expose real customer data yet.
- `ADMIN_ACCESS.superuserEmails` is intentionally empty; add admin emails there before connecting real admin data.
- When real data APIs are added, backend must enforce superuser claims/custom claims, not just frontend checks.

## Browser QA
- `/admin` opens the admin login entry.
- Admin shell renders the operational dashboard in setup mode.
- Dashboard displays:
  - 슈퍼유저
  - 사용량
  - 접속 통계
  - 유료 사용자
  - 매출액
  - 전환율
- Console: no JavaScript errors.

## Verification
- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS

## Follow-up
- Add backend admin API with Firebase custom-claim check.
- Aggregate Firestore `monthlyUsage` into admin usage metrics.
- Connect Firebase/GA access statistics.
- Connect billing/subscription data for paid users and revenue.

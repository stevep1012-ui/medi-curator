# Commercial Auth & Free-Quota Gate

## Date
- 2026-07-02

## User Direction
- Guest users should see the menu and product flow only.
- Actual feature use should require signup/login.
- Free members should have a monthly usage limit to make the product more commercially structured.

## Decision
- Reversed the previous guest-health-card approach for commercial fit.
- Guest mode is now browse-only.
- Logged-in free members can use AI features, but server-side monthly usage is limited.

## Implemented Changes

### 1. Guest browse-only gate
- Guests can dismiss the login modal and view the home page, feature menu, routine panel, Plus value panel, footer, and policy links.
- When a guest opens a feature card, the app shows a commercial login gate instead of the feature UI.
- Gate copy explains:
  - guest = menu/product exploration only
  - features require free membership login
  - free membership includes monthly AI usage

### 2. Removed guest functional fallback
- The client no longer provides local symptom-analysis results to guests.
- If a feature somehow calls `/api/curate` without auth, the error remains mapped to login-required behavior.

### 3. Free monthly usage limit
- `enforceCentralRateLimit()` now tracks both:
  - hourly limit: 30/hour
  - monthly free limit: 30/month
- Monthly usage is stored in Firestore collection `monthlyUsage` with:
  - `uid`
  - `count`
  - `month`
  - `windowStart`
  - `expiresAt`
  - `limit`
- Existing hourly usage remains in `rateLimits`.
- The same monthly quota applies to `curate`, `interaction`, and AI tool endpoints that use the shared rate limiter.

## Browser QA Evidence

| Flow | Result |
|---|---|
| Initial visit | Login modal appears. |
| `로그인 없이 메뉴만 보기` | Home/menu remains visible. |
| Guest clicks `증상 분석` | Feature UI is not shown. Login gate is shown. |
| Guest lock screen | Shows `로그인 후 이용할 수 있어요`, `Google로 시작`, `Naver로 시작`, and monthly free-usage copy. |
| Console | No JavaScript errors. |

## Verification

- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- `npm --prefix functions run build` PASS

## Commercial Rationale
- Guest browsing now supports discovery without giving away the core utility.
- Login becomes the activation step.
- Monthly quota establishes a free tier boundary and creates a natural Plus conversion surface.

## Follow-up
- Add a visible free-usage meter after login, e.g. `이번 달 7/30회 사용`.
- Connect `Plus 관심 등록` to server-side lead capture.
- Later, replace fixed `30/month` with plan-based limits once billing exists.

# Usage Limits Configuration Split

## Date
- 2026-07-03

## Request
- Make usage limits easy to change later by moving them into a separate place.

## Change

### Server-side enforced policy
- Added `functions/src/usageLimits.ts`.
- This is the Cloud Functions source of truth for enforced free-member limits.
- To change the actual backend limit, edit:
  - `FREE_USAGE_LIMITS.hourlyAiRequests`
  - `FREE_USAGE_LIMITS.monthlyAiRequests`
- Centralized server messages in the same file:
  - `USAGE_LIMIT_MESSAGES.exceeded`
  - `USAGE_LIMIT_MESSAGES.unavailable`

### Client display copy
- Added `src/config/usageLimits.ts`.
- This keeps the visible Korean copy/label in one frontend config area.
- Current UI uses `FREE_USAGE_COPY.monthlyLabelKo` instead of hard-coded `월 30회`.
- Client rate-limit error copy uses `FREE_USAGE_COPY.exceededKo`.

## Files Updated
- `functions/src/usageLimits.ts`
- `functions/src/rateLimit.ts`
- `functions/src/index.ts`
- `functions/src/aiTools.ts`
- `src/config/usageLimits.ts`
- `src/app/page.tsx`
- `src/app/components/Chrome.tsx`
- `src/services/geminiService.ts`

## How to Change Later

For production enforcement:
1. Open `functions/src/usageLimits.ts`.
2. Change the numbers:
   - `hourlyAiRequests`
   - `monthlyAiRequests`
3. Deploy functions.

For visible UI wording:
1. Open `src/config/usageLimits.ts`.
2. Change `monthlyLabelKo` and related copy.
3. Deploy hosting.

## Verification
- `npm run lint` PASS
- `npm run build` PASS
- `npm --prefix functions run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS

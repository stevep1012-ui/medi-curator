# Member Signup Onboarding

## Date
- 2026-07-03

## Request
- After login/signup, users should pass a membership setup step.
- Collect nickname.
- Register an email for email-verification/contact flow.
- For Google login, default to the Google email but allow another answer/contact email.

## Implemented

### Onboarding gate
- Added `src/app/components/MemberOnboarding.tsx`.
- After OAuth login, before feature use, the app checks whether the member profile exists.
- If missing, the user must complete onboarding before continuing.

### Fields
- Nickname
- Login email display
- Login email verification state
- Answer/contact email selection:
  - use login email by default
  - or enter a new email

### Email verification
- Added `sendCurrentUserEmailVerification()` in `src/firebase.ts`.
- If the Firebase login email is not verified, the onboarding screen can send Firebase's verification email.
- Alternative/custom answer email is stored as pending/unverified; actual external verification mail for a custom address requires a later transactional email provider.

### Profile persistence
- Added `src/services/memberProfileService.ts`.
- Stores profile at:
  - `users/{uid}/profile/main`
- Also mirrors to localStorage as a fallback if Firestore is unavailable locally.

### Firestore rules
- Updated `firestore.rules` to allow the signed-in user to read/write only their own profile document.
- Allowed profile fields are constrained to nickname and email metadata.
- Symptoms, medication data, and search history remain blocked from server persistence.

## Verification
- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- Browser guest flow remains locked behind login.
- Console errors: none.

## Follow-up
- Add transactional email verification for custom answer emails.
- Add profile edit screen under account/privacy.
- Surface nickname in account menu after onboarding.

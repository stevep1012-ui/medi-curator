# Profile Edit and Account Menu

## Date
- 2026-07-07

## Goal
Continue the member signup flow by making the captured membership profile visible and editable after onboarding.

## Implemented

### Account menu identity
- Updated `src/app/components/Chrome.tsx`.
- The account chip now prefers the member nickname over the raw provider name.
- The dropdown shows:
  - nickname or provider name
  - answer/contact email when available
  - profile edit action for signed-in non-guest users

### Profile edit entry point
- Updated `src/app/page.tsx`.
- Clicking `프로필 수정` in the account menu moves the user to the privacy/account area.
- The profile state is passed into the privacy screen and updated after saving.

### Profile edit form
- Updated `src/app/components/MemberOnboarding.tsx` to support reuse as an edit form:
  - `initialProfile`
  - custom title
  - custom subtitle
  - custom submit label
- Updated `src/app/components/PrivacySettings.tsx` to render the profile form above consent/privacy controls for signed-in users.

## User Flow
1. User signs in.
2. If no profile exists, onboarding collects nickname and answer email.
3. Account chip shows nickname after profile is saved.
4. User can open account menu and click `프로필 수정`.
5. Privacy/account page lets the user update nickname and answer email.
6. Saved profile updates the account chip immediately.

## Verification
- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- Browser guest account dropdown smoke test PASS
- Browser console errors: none

## Notes
- Guest users do not see profile edit because they have no Firebase UID.
- This still avoids storing symptoms, medications, photos, or search text in Firestore.
- Custom answer-email verification still needs a transactional email provider in a later step.

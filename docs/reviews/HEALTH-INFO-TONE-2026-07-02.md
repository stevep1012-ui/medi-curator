# Health Info Tone Adjustment

## Date
- 2026-07-02

## User Concern
- The product sounded too defensive and repeatedly framed the experience around legal risk.
- User expectation: Google-like general health information, including practical symptom and OTC-option information, while legal review remains separate.

## Decision
- Move product-facing tone from “legal hold / no recommendation” to “general health information card.”
- Keep hard safety boundaries only where needed:
  - no diagnosis/prescription wording
  - no prescription-drug recommendation
  - emergency and self-harm routing remains immediate
  - schema validation and forbidden-phrase guard remain active

## Implemented Changes

1. Cloud Function prompt
   - Allows general OTC ingredient/category examples for symptom relief.
   - Allows lifestyle tips, self-care, recovery course, and folk-remedy style general info.
   - Keeps prescription-drug recommendations blocked.
   - Keeps dose instructions non-specific: product label + pharmacist/doctor checks.

2. Symptom result UI
   - Added rendering for `otcMedications`.
   - Added rendering for `lifestyleTips`.
   - Added rendering for `recoveryTimeline`.
   - These fields already existed in the schema but were not displayed in the active UI.

3. Korean UX copy
   - Reduced “진단/처방 아님” repetition on visible product surfaces.
   - Footer now says “일반 건강정보” rather than “교육용/의학적 진단 아님.”
   - Symptom page explains that it organizes general health information and OTC options.

## Verification

- `npm run lint` PASS
- `npm run build` PASS
- `npm --prefix functions run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- Local browser smoke check PASS

## Remaining Product Work

- Server-side live Gemini response should be checked after functions deploy with an authenticated/consented account.
- OTC results should later be cross-checked against an explicit MFDS/OTC master list before production launch.
- Billing/legal/policy wording remains separate and intentionally not resolved in this pass.

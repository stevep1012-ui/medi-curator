# Commercial Growth Upgrade

## Date
- 2026-06-30

## Question
- Is the product commercially strong enough for users to pay?
- What should be added so users keep returning and eventually feel a paid plan is worth it?

## Current Commercial Verdict
- Verdict: WATCH, improved toward paid-value readiness.
- Reason: The app already has differentiated regulated Health-AI utility: medication photo capture, local medication list, symptom organization, interaction/safety check, pharmacy finder, and privacy-first positioning. Before this change, the home screen did not strongly turn those capabilities into a repeated habit or a clear payment-worthy value narrative.

## Changes Implemented

| Area | Upgrade | Commercial Impact |
|---|---|---|
| Retention | Added a daily 3-minute health check-in routine on the home screen. | Gives users a reason to return, not just a one-time utility. |
| Habit loop | Added progress percentage, local streak, and saved-med count. | Makes usage visible and rewarding without gamifying health risk. |
| Conversion foundation | Added “Value worth paying for” panel. | Frames why recurring routines, consultation prep, and reusable med lists could support a paid tier. |
| Real feature, not just copy | Added consultation brief export as a downloadable text file. | Creates a tangible asset users can take to a pharmacist/doctor. |
| Privacy trust | Export includes saved medicine names and routine status only, not photos or raw symptom text. | Keeps commercial value aligned with the Health-AI privacy posture. |
| Navigation | Routine items deep-link to the relevant tool. | Reduces friction and increases feature discovery. |

## Product-Market Insight

The most payment-worthy direction is not “AI diagnosis.” That is legally and medically risky. The stronger commercial wedge is:

1. A private medication memory that users can reuse.
2. A consultation-prep workflow that saves time before visiting a pharmacist or doctor.
3. A repeatable daily/weekly health admin routine.
4. A local-first trust promise: useful without making users feel their health photos are being stored or sold.

## Remaining WATCH Items

- Billing is not implemented, so “paid tier” is still a positioning and roadmap surface, not a real subscription flow.
- The consultation brief is intentionally plain text. A polished PDF/share sheet would likely increase willingness to pay.
- Reminder notifications are not implemented. Local reminder scheduling would strengthen retention.
- Family/caregiver profiles are not implemented. This could become a strong paid feature, but it raises privacy and consent complexity.

## Verification

- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- `npm --prefix functions run build` PASS

## LEGAL_HOLD

- Any actual paid health subscription claim, legal wording, advertising-law interpretation, privacy policy change, and SaMD boundary remain outside this commercial pass.

# Guest Health Cards QA

## Date
- 2026-07-02

## Goal
- Continue product loop after the tone change.
- Ensure Google-like general health information is actually visible to a first-time/guest user, not blocked by login, consent, or server-only AI.

## Finding
- The symptom UI had been changed to display OTC/lifestyle/recovery cards.
- However, guest users still depended on `/api/curate` and could hit auth/consent or local dev proxy blockers before seeing useful information.
- For commercial entry, the first run must show value immediately.

## Implemented Change
- Added a local, schema-validated general-health fallback in `src/services/geminiService.ts` when no Firebase ID token is available.
- The fallback covers common first-run cases:
  - cough/sore throat
  - abdominal discomfort/heartburn
  - headache/general pain
- It returns the same validated `CurationResult` shape as the server:
  - recommended department
  - general explanation
  - OTC ingredient/category options
  - lifestyle tips
  - expected course
  - red flags
  - short general-health disclaimer

## Safety / Product Boundary
- The fallback does not call Gemini and does not transmit symptoms.
- It does not recommend prescription drugs.
- It avoids specific dose instructions and tells users to follow product labels.
- Emergency red flags remain visible.
- Logged-in/consented users still use the server Gemini path.

## Browser QA Evidence

| Case | Result |
|---|---|
| Guest mode → symptom analysis | Results render without login. |
| `목이 아프고 기침이 나요. 열은 없어요.` | Shows ENT/internal medicine, OTC options including acetaminophen and cough/expectorant categories, lifestyle tips, expected course, red flags. |
| `배가 아프고 속이 쓰려요. 설사는 없어요.` | Shows internal medicine/gastroenterology and antacid/acid-relief option. |
| Console | No JavaScript errors. |

## Verification

- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- `npm --prefix functions run build` PASS

## Commercial Impact
- First-time users now see useful Google-like health cards immediately.
- The product no longer feels like it blocks value behind legal/auth language.
- This improves activation before login and makes the Plus funnel more credible.

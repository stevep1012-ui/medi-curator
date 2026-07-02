# Product Dogfood & Commercial Flow Review

## Date
- 2026-07-02

## Scope
- User-perspective entry flow
- Core feature discoverability
- Daily routine loop
- Payment-worth/value narrative
- Plus interest capture
- Legal/regulatory interpretation intentionally held out of scope

## Initial Findings

| Area | Finding | Severity | Status |
|---|---|---:|---|
| Entry | Home hero explained the product but had no direct first-action CTA above the fold. Users had to infer the next step from icon cards. | High | Fixed |
| Routine | Daily 3-minute routine existed and was understandable, but it was not connected to the hero entry. | Medium | Fixed |
| Commercial | “Value worth paying for” described strategy but did not show concrete Plus benefits or an interest action. | High | Fixed |
| Layout | Commercial panel became much taller after Plus benefits were added; left routine panel stretched to match height, creating empty space. | Medium | Fixed |

## Implemented Changes

1. Added above-the-fold hero CTAs:
   - `3분 점검 시작` routes directly to `내 약·비타민`.
   - `상담 준비하기` routes directly to `복용 검사`.

2. Made payment-worth flow concrete:
   - Added `Plus로 열릴 기능` section.
   - Listed concrete non-legal product benefits:
     - 상담용 요약 PDF와 공유 링크
     - 가족·보호자 약 목록 분리 관리
     - 주간 점검 리포트와 리마인더
   - Added `Plus 관심 등록` CTA.
   - Interest signal is stored locally as `medi-curator:plus-interest=yes`.
   - Button changes to disabled `관심 등록됨` state after registration.

3. Improved visual polish:
   - Prevented the routine panel from stretching vertically to match the taller commercial panel.
   - Commercial and routine panels now align more naturally with `self-start`.

## Browser Dogfood Evidence

| Flow | Result |
|---|---|
| Guest entry | Login dialog dismissed with “로그인 없이 둘러보기”; home remains usable. |
| Hero CTA | `3분 점검 시작` navigates to `내 약·비타민`. |
| Return home | `← 홈` returns to home. |
| Plus interest | Local interest capture sets `medi-curator:plus-interest=yes`; button changes to `관심 등록됨`. |
| Console | No JavaScript console errors observed during the tested flow. |

## Verification

- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- `npm --prefix functions run build` PASS
- Local browser dogfood PASS

## Commercial Readiness Verdict

Verdict: WATCH → improved.

The product now has a clearer commercial funnel:

1. Above-the-fold CTA tells the user where to start.
2. Daily routine cards convert one-off utility into repeated use.
3. Consultation brief gives the user a tangible artifact.
4. Plus benefit list explains why payment could be justified.
5. Plus interest capture creates a non-payment validation signal before billing is implemented.

## Remaining Non-Legal Product Gaps

- Actual billing/subscription is still not implemented.
- Plus interest is local-only; it is not yet aggregated server-side.
- Consultation brief is still plain text, not polished PDF/share sheet.
- Reminder scheduling is not implemented.
- Family/caregiver profiles are not implemented.

## LEGAL_HOLD

The following remain intentionally out of scope and should require separate review before production claims or launch:

- Production legal wording and policy interpretation
- Advertising-law / pharmacy-referral interpretation
- Medical-device / SaMD classification
- Paid health subscription claim review
- Privacy/PIPA legal interpretation

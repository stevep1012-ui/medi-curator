---
description: 법률 판단을 보류하고 제품 안전성·오남용·응급·프롬프트 인젝션·기능 진실성 red-team만 실행한다.
---

`nonlegal-red-team-monitor` 에이전트 Task 호출.

## 절차

1. 범위를 먼저 선언한다.
   - 포함: 안전성, 오남용, 청소년/취약 사용자 리스크, 응급 우선순위, 프롬프트 인젝션, 원본 사진/base64 비저장, 카메라/사진/지도/AI 기능 진실성.
   - 제외: 법률/저작권/라이선스/약사법/의료법/의료기기법/SaMD/광고법/PIPA 법률 해석.
2. 자동 점검 실행:
   - `npm run audit:redteam:nonlegal`
3. 변경된 기능 경로를 코드에서 직접 인벤토리한다.
   - 사진/처방전: `MedCapture.tsx`, `aiTools.ts`, `aiToolsService.ts`, `medStore.ts`
   - 응급: `src/lib/emergency.ts`, `SymptomInput.tsx`
   - 약국/지도: `PharmacyFinder.tsx`, `pharmacyService.ts`, `functions/src/pharmacies.ts`
   - AI 출력: Zod schemas, `violatesForbidden`, Gemini proxy
4. 결과를 `docs/reviews/REDTEAM-NONLEGAL-<YYYY-MM-DD>.md`에 저장한다.
5. `BLOCK`은 즉시 수정 대상으로, `WATCH`는 후속 모니터링 대상으로 backlog화한다.
6. 법률 판단이 필요한 항목은 `LEGAL_HOLD`로만 표시하고 결론 내리지 않는다.

## 사용자 요약

사용자에게는 다음만 요약한다.
- 자동 red-team 결과
- BLOCK/WATCH 항목
- 법률 보류(`LEGAL_HOLD`) 항목
- 재실행 명령

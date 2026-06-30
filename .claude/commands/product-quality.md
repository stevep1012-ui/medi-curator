---
description: 프로그램 디렉터가 coding/design/workflow/usability/UX 제품성 축을 통합 점검하고 remediation loop를 만든다.
---

`program-director` 에이전트를 호출해 제품 완성도 점검을 실행한다.

## 절차

1. `program-director`는 다음 파일을 먼저 읽는다.
   - `AGENTS.md`
   - `.claude/policies/product-quality.yaml`
   - `.claude/policies/monitoring.yaml`
2. 변경 범위가 영향을 주는 품질 축을 식별한다.
   - Coding: `coding-quality-auditor`
   - Design: `design-quality-auditor`
   - Workflow: `workflow-integrity-auditor`
   - Usability: `usability-auditor`
   - UX: `ux-navigation-auditor`
   - Runtime: `runtime-reliability-auditor`
   - Non-legal red-team: `nonlegal-red-team-monitor`
3. 필요한 subagent를 호출한다.
4. `WATCH`/`BLOCK` finding은 remediation backlog로 전환한다.
5. 구현 owner가 수정한 뒤 같은 monitor set을 재실행한다.
6. 결과를 `docs/reviews/PRODUCT-QUALITY-<YYYY-MM-DD>.md`에 저장한다.

## 필수 검증 명령

- `npm run audit:redteam:nonlegal:report`
- `npm run lint`
- `npm run build`
- `npm run scan:secrets`
- `npm run scan:bundle`
- Functions 관련 변경 시 `npm --prefix functions run build`

## 사용자 요약

사용자에게는 다음만 요약한다.
- 제품성 전체 판정
- Coding / Design / Workflow / Usability / UX / Runtime / Red-team 상태
- 남은 WATCH/BLOCK
- LEGAL_HOLD 항목
- 다음 실행 명령

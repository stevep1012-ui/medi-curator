---
description: 상업성·UX·흐름·runtime·red-team 지속 모니터링 리포트를 만든다.
---

`program-manager` 에이전트를 호출해 medi-curator 상업 모니터링을 실행한다.

## 절차
1. `program-manager`를 `monitor` 모드로 호출한다.
2. `program-manager`는 `.claude/policies/launch-program.yaml`의 `monitoring` 섹션을 기준으로 필요한 subagent를 위임한다.
3. `WATCH` 또는 `BLOCK` finding이 있으면 remediation backlog를 만들고 같은 모니터를 재실행한다.
4. `AGENTS.md`의 "상품성 100%" 정의를 만족하면 종료한다.
5. 결과는 `docs/reviews/LAUNCH-monitor-<YYYY-MM-DD>.md` 형식으로 저장한다.
6. 사용자에게는 다음만 요약한다.
   - 상업성 판정
   - 흐름/UX 문제
   - runtime 오류
   - red-team 경고
   - 다음 실행 명령

## 필수 조건
- 상업성 저하, 메뉴 혼선, runtime 오류, red-team 경고는 숨기지 않는다.
- `WATCH`는 재검토 대상으로, `BLOCK`은 즉시 수정 대상으로 분류한다.
- 의료/법무/개인정보 차단권은 PM이 재해석해서 통과시킬 수 없다.
- 코드 변경이 필요한 항목은 담당 구현 에이전트에게 넘기고, PM은 직접 수정하지 않는다.

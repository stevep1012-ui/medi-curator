---
description: 단일 에이전트 단독 호출. 디버그 또는 특정 영역만 검수 시 사용.
argument-hint: "<agent-name> [추가 컨텍스트]"
---

`$ARGUMENTS` 의 첫 토큰을 에이전트명으로 해석. `.claude/agents/<name>.md` 가 존재하면 Task 호출. 없으면 사용 가능한 에이전트 목록 출력.

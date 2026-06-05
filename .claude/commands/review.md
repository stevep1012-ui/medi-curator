---
description: 현재 워킹트리 또는 PR을 받아 STATIC + CODE-REVIEW 게이트를 실행한다.
argument-hint: "[PR번호 또는 파일경로]"
---

다음 순서로 진행하라:

1. `git diff --stat` 으로 변경 범위 파악.
2. `AGENTS.md §4 자동화 규칙` 매칭 결과 출력.
3. STATIC 게이트: `npm run lint`, `tsc -b --noEmit`, 비밀키 정규식 스캔.
4. `code-reviewer` 에이전트 Task 호출 → 인라인 코멘트 수집.
5. `orchestrator` 에이전트 호출 → 추가 디스패치 필요 게이트(SEC/PRIV/LEGAL/MED) 안내.
6. 결과를 `docs/reviews/CR-$(date +%Y-%m-%d-%H%M)-$ARGUMENTS.md` 로 저장.

마지막에 PASS/FAIL 요약 표 출력.

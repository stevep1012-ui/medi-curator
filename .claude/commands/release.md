---
description: 모든 게이트 결과 집계 → 릴리스 결정 + 카나리 플랜 + 롤백 절차.
---

`release-manager` 에이전트 Task 호출.
1. `docs/reviews/` 의 최근 게이트 결과 수집.
2. 게이트 매트릭스 출력.
3. 전부 PASS → 릴리스 노트 초안 + 카나리 명령어 출력.
4. 차단권 게이트 BLOCK → HOLD 사유 명시.

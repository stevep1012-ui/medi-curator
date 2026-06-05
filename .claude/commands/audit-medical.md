---
description: MED-gate 단독 실행. 회귀 프롬프트셋·OTC 화이트리스트·redFlag 누락 검사.
---

`medical-reviewer` 에이전트 Task 호출. 회귀셋 실행은 `node scripts/run-medical-regression.mjs` (구현 예정).
결과 → `docs/reviews/MED-$(date +%Y-%m-%d-%H%M).md`.

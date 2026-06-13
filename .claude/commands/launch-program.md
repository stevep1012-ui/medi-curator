---
description: 출시 총괄 PM이 트랙별 subagent를 오케스트레이션하여 GO/HOLD/BLOCKED 판단과 다음 실행 계획을 만든다.
argument-hint: "[baseline|p0|gates|decision|monitor]"
---

당신은 `program-manager` 에이전트를 호출해 medi-curator 출시 프로그램을 운영한다.

## 입력 모드
- `baseline`: 현재 출시 가능성 기준선 점검
- `p0`: P0 차단 항목 실행 계획과 담당자 배정
- `gates`: 게이트 검증 상태 집계
- `decision`: 최종 GO/HOLD/BLOCKED 판단
- `monitor`: 상업성·UX·흐름·runtime·red-team 지속 모니터링

인자가 없으면 `baseline`으로 실행한다.

## 절차
1. `program-manager`를 호출한다.
2. `program-manager`는 `.claude/policies/launch-program.yaml`을 기준으로 필요한 subagent를 위임한다.
3. 결과는 `docs/reviews/LAUNCH-<mode>-<YYYY-MM-DD>.md` 형식으로 저장한다.
4. 사용자에게는 다음만 요약한다.
   - 출시 판단
   - P0 차단 항목
   - 담당 에이전트
   - 다음 실행 명령

## 필수 조건
- `BLOCKED` 또는 `HOLD` 판단을 숨기지 않는다.
- 법무/의학/개인정보 차단권은 PM이 재해석해서 통과시킬 수 없다.
- 코드 변경이 필요한 항목은 담당 구현 에이전트에게 넘기고, PM은 직접 수정하지 않는다.

# Medi-Curator Production Launch Program

## 목표
Firebase 기반 구조를 유지하되, Health-AI 출시 기준을 만족하는 운영 구조로 전환한다.

## 출시 판단 기준
출시는 `GO`, `HOLD`, `BLOCKED` 중 하나로 판단한다.

- `GO`: 모든 blocking gate 통과, Firebase/Functions/Rules 배포 확인, 롤백 플랜 준비.
- `HOLD`: 출시 가능성은 있으나 검증 또는 승인 미완료.
- `BLOCKED`: 민감정보, 비밀키, 의료/법무 안전성 중 중대 위반 존재.

## 총괄 PM
총괄 PM 에이전트는 `.claude/agents/program-manager.md`다.

역할:
- 출시 범위 정의
- P0/P1/P2 우선순위 결정
- subagent 위임
- 게이트 결과 집계
- GO/HOLD/BLOCKED 판단

## Workflow Agent
Workflow 에이전트는 `.claude/agents/workflow-manager.md`다.

역할:
- milestone 실행 순서 관리
- 선행 조건과 중단 조건 확인
- 병렬/순차 작업 구분
- gate 실패 시 다음 단계 중단
- rollback workflow 관리

## Subagent 트랙
| 트랙 | 목적 | 담당 |
|---|---|---|
| T0-PRODUCT | 출시 범위와 사용자 여정 | product-strategist |
| T1-SECURITY | 인증, 비밀키, 서버 프록시 | security-auditor |
| T2-PRIVACY | PIPA, 동의, 암호화, DSR | privacy-officer |
| T3-LEGAL-MEDICAL | 약사법, 의료법, SaMD, 약관, redFlag | legal-launch-lead |
| T4-ENGINEERING | API, 타입, 스키마, 감사로그 | api-engineer |
| T5-QA-RELEASE | 테스트, 배포, 롤백 | qa-engineer |
| T6-COMMERCIAL | 상업성, 메뉴 트리, UX, runtime, red team | commercial-strategist |

## 초기 P0
| ID | 내용 | 담당 |
|---|---|---|
| P0-001 | Gemini API key 브라우저 노출 제거 | api-engineer |
| P0-002 | 건강 이력 서버 저장 제거, 개인 디바이스에만 보관 | privacy-officer |
| P0-003 | OTC 추천과 약국 위치 결합 리스크 해소 | legal-advisor |
| P0-004 | 자살/자해 플로우에서 1393 우선 노출 | medical-reviewer |
| P0-005 | Firestore Rules 배포 검증 | security-auditor |
| P0-006 | LLM 출력 Zod 런타임 검증 강제 | api-engineer |

## 법무 확인 체계
`legal-launch-lead`가 출시 법무 확인을 총괄한다.

| Subagent | 역할 | 출시 전 산출물 |
|---|---|---|
| medical-practice-law-auditor | 의료법, 무면허 의료행위, 진단/처방 경계 | 진단/처방 표현 차단표 |
| pharma-advertising-auditor | 약사법, 의약품 광고, OTC/약국 결합 | OTC/약국 UI 분리 판단 |
| samd-regulatory-auditor | 의료기기법, SaMD 분류 | SaMD 해당 가능성 메모 |
| privacy-legal-auditor | PIPA, 민감정보, 국외이전, DSR | 동의/암호화/DSR 법무 체크 |
| crisis-safety-legal-auditor | 자살/자해/응급 고지 | 공식 상담번호 확인 및 UI 우선순위 |
| terms-policy-counsel | 이용약관, 개인정보처리방침, 면책 | 정책 문서와 실제 기능 일치표 |
| jurisdiction-watch-auditor | ko/en/zh/ja/es 관할권 리스크 | 국가별 출시 제한 메모 |

법무 게이트는 다음 순서로 처리한다.

1. 최신 공식 출처 확인
2. 화면 카피, 프롬프트, 데이터 흐름 검토
3. subagent별 `PASS | CONDITIONAL | BLOCK` 판단
4. `legal-launch-lead` 통합 판단
5. 외부 변호사 또는 규제 전문가 확인 항목 분리
6. `legal-advisor` 최종 LEGAL-gate 확인

## 상업성 및 red-team 확인 체계
`commercial-strategist`가 상업성·메뉴 트리·UX·런타임·red-team 확인을 총괄한다.

| Subagent | 역할 | 출시 전 산출물 |
|---|---|---|
| workflow-integrity-auditor | 메뉴 트리, 탭 흐름, 상태 전이 | dead-end 및 혼선 목록 |
| ux-navigation-auditor | 시인성, 탭 구조, 모바일 내비게이션 | UX gap report |
| runtime-reliability-auditor | 실제 클릭 경로, 콘솔/네트워크 오류 | runtime smoke report |
| red-team-monitor | 오남용, 청소년 유해정보, prompt injection | red-team finding log |

상업성/monitoring 루프는 다음 기준으로 반복한다.

1. 핵심 사용자 작업이 3탭 이내에 도달 가능한지 확인
2. 주요 CTA와 다음 행동이 화면 상단에서 바로 식별되는지 확인
3. 실제 실행 경로에서 콘솔 오류와 네트워크 실패가 없는지 확인
4. 유해정보, 과장된 의료 표현, 청소년 리스크를 red-team으로 재검토
5. 결과를 `docs/reviews/COMMERCIAL-<YYYY-MM-DD>.md` 와 `docs/reviews/REDTEAM-<YYYY-MM-DD>.md` 에 저장

## 지속 개선 종료 기준

개선 루프는 아래 조건을 모두 만족할 때 종료한다.

1. `commercial-strategist`, `workflow-integrity-auditor`, `ux-navigation-auditor`, `runtime-reliability-auditor`, `red-team-monitor` 모두 `PASS`
2. `WATCH` 또는 `BLOCK` finding이 0건
3. 릴리스 필수 게이트 1~7 PASS
4. 사용자 핵심 작업이 막힘 없이 완료됨
5. 상업성/신뢰성/안전성에 대한 추가 수정 필요가 더 이상 없음

## 실행 명령
```text
/launch-program baseline
/launch-program p0
/launch-program gates
/launch-program decision
/launch-program monitor
```

## 운영 원칙
- PM은 직접 코드를 수정하지 않는다.
- 구현은 담당 subagent가 수행한다.
- 차단권 게이트 실패 시 release-manager는 출시를 중단한다.
- 모든 결과는 `docs/reviews/`에 감사 추적으로 남긴다.

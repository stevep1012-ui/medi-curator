# medi-curator · 에이전틱 하네스 (AGENTS.md)

> **목적**: medi-curator를 단순 React/Vite 앱이 아니라, **고규제 도메인(Health-AI)** 의 프로덕션 릴리스 파이프라인으로 운영한다.
> 모든 변경은 **온톨로지 → 에이전트 그래프 → 품질 게이트 → 릴리스** 순서로 흘러야 한다.
> 이 문서는 Claude Code / Hermes / Cursor / Copilot 등 모든 코딩 에이전트가 작업 시작 전에 읽는 **단일 진입점(Source of Truth)** 이다.

---

## 0. TL;DR — 이 프로젝트에서 절대 어기면 안 되는 5가지

1. **VITE_GEMINI_API_KEY 를 브라우저 번들에 넣지 말 것.** 모든 LLM 호출은 서버사이드(Edge/Cloud Function) 프록시 경유. (현재 코드는 위반 상태 → R-001 참조)
2. **PIPA §23 민감정보(건강정보)** 는 서버/Firestore에 저장 금지. 검색 이력은 로그인 사용자별 개인 디바이스 로컬 저장소에만 보관.
3. **약사법 §50 / 의료기기법(SaMD) / 의료법 §27** 의 광고·진단 경계를 코드 레벨에서 강제. OTC 추천 + 약국 위치 결합은 *알선 광고*로 해석될 수 있어 `legal-advisor` 게이트 통과 필수.
4. **자살/자해 키워드**가 트리거되면 **1393 (자살예방상담전화)** 우선 노출. 단순 119 안내는 부적합 (R-005).
5. **모든 LLM 출력은 Zod 스키마로 런타임 검증**. 검증 실패 = 사용자에게 노출 금지 (현재 미구현, R-008).

## 0.1 상품성 100% 정의

이 프로젝트에서 "상품성 100%"는 주관적 만족이 아니라 다음 조건이 모두 충족된 상태를 뜻한다.

- `commercial-strategist`: PASS
- `workflow-integrity-auditor`: PASS
- `ux-navigation-auditor`: PASS
- `runtime-reliability-auditor`: PASS
- `red-team-monitor`: PASS
- 상업성/흐름/UX/runtime/red-team 리포트에 `WATCH` 또는 `BLOCK` 없음
- 릴리스 게이트 1~7 모두 PASS

이 조건이 충족되지 않으면, agent들은 수정 → 재검증 루프를 계속 반복한다.

---

## 1. 도메인 온톨로지 (요약)

전체 사양은 `docs/ontology/ONTOLOGY.md` 참조. 핵심 계층만 여기 게시.

```
HealthInformationSystem (root)
├── Actor
│   ├── EndUser            ← 일반 사용자 (잠재 환자 ≠ 환자)
│   ├── AuthenticatedUser  ← Firebase Auth, 개인 디바이스 로컬 검색 이력 보유
│   └── EmergencyContact   ← 119 / 1393 / 1577-0199
├── Artifact
│   ├── SymptomQuery       ← {symptoms, currentMedications, language, age?}
│   ├── CurationResult     ← Gemini 출력 (8개 필드, Zod 검증 필요)
│   │   ├── OTCMedication        ← 약사법·식약처 OTC 리스트 교차검증 대상
│   │   ├── RedFlag              ← 응급 트리거
│   │   ├── ExercisePlan         ← 운동처방 (재활의학 근거 필요)
│   │   └── RecoveryTimeline     ← 통계 근거 필요
│   ├── PharmacyRecord     ← Google Places (KR 약국)
│   └── AuditLogEntry      ← 모든 LLM 호출·동의·삭제 이벤트
├── Process
│   ├── Curation       (LLM)        : SymptomQuery → CurationResult
│   ├── Geolocation                 : Position → Pharmacy[]
│   ├── HistoryPersistence (Local): CurationResult → device localStorage
│   └── EmergencyEscalation         : RedFlag → ContactSurface
└── Regulation       ← 모든 Process가 통과해야 하는 횡단 관심사
    ├── PIPA              (개인정보보호법)
    ├── PharmacistAct     (약사법 §50, §61)
    ├── MedicalServiceAct (의료법 §27 — 무면허 의료행위)
    ├── MedicalDeviceAct  (의료기기법 — SaMD 분류 검토)
    ├── AdvertisingAct    (의료광고 사전심의)
    └── MFDS_OTC_List     (식약처 일반의약품 마스터)
```

### 의존성 그래프 (변경 영향 분석용)

```
geminiService ──┬──> CurationResult ──┬──> CurationResult.tsx
                │                     ├──> symptomService (개인 디바이스 로컬 저장)
                │                     └──> AuditLog
                └── 의존: 시스템 프롬프트 ← legal-advisor 검수 필수

pharmacyService ──> Pharmacy[] ──> PharmacyFinder.tsx
                                   └── 의존: OTC 추천과 결합 시 알선광고 검토

AuthContext ──> ConsentRecord ──> Firestore Security Rules (동의·감사 서버 데이터만)
```

**규칙**: `geminiService.ts`의 시스템 프롬프트, `types/index.ts`의 `CurationResult` 스키마, 또는 PIPA 동의 플로우를 변경하는 PR은 **반드시 `legal-advisor` + `medical-reviewer` 두 에이전트의 승인 라벨**이 있어야 머지 가능.

---

## 2. 에이전트 그래프 (16 + 1)

모든 에이전트는 `.claude/agents/<name>.md` 에 정의됨. Claude Code의 subagent 포맷(YAML frontmatter + 시스템 프롬프트)을 따른다.

| # | Agent | 역할 | 입력 | 출력 | 게이트 권한 |
|---|---|---|---|---|---|
| 0 | **orchestrator** | 전체 파이프라인 조율, 에이전트 디스패치 | 작업 의도 | 실행 계획 + 단계별 위임 | (메타) |
| 1 | **product-strategist** | 변경의 사용자 가치·규제 영향·상업성 평가 | 변경 의도 | 영향평가 보고 | -- |
| 2 | **ux-designer** | UX 흐름·접근성(WCAG 2.2 AA)·다국어 카피 검수 | UI 변경 | Figma-class 스펙 + 카피 | UX-gate |
| 3 | **frontend-architect** | React 19 / Vite 8 / TS 구조·상태관리 설계 | 설계 의도 | 컴포넌트 계약·타입 | ARCH-gate |
| 4 | **api-engineer** | Gemini 프록시·Firebase 함수·레이트리밋 구현 | 백엔드 요구 | 서버 코드 + 계약 | -- |
| 5 | **security-auditor** | 비밀키·CSP·OWASP ASVS·Firestore 규칙 | 코드 diff | 취약점 보고 + 차단 라벨 | SEC-gate (차단권) |
| 6 | **privacy-officer** | PIPA §23 민감정보·동의·DSR(열람·삭제) | DB 스키마·UI | 동의서 카피 + DPIA | PRIV-gate (차단권) |
| 7 | **legal-advisor** | 약사법·의료법·의료기기법·광고법 검토 | 기능 사양 + LLM 프롬프트 | 법적 의견서 + 필수 고지 카피 | LEGAL-gate (차단권) |
| 8 | **medical-reviewer** | 임상/약리 정확성·EBM·식약처 OTC 교차검증 | LLM 출력 샘플 | 정확성 리포트 | MED-gate (차단권) |
| 9 | **code-reviewer** | TS strict·ESLint·React Hooks·렌더 최적화 | PR diff | 인라인 코멘트 + 패치 제안 | CODE-gate |
| 10 | **qa-engineer** | Vitest/Playwright/MSW 테스트 작성·실행 | 변경 코드 | 테스트 + 커버리지 보고 | QA-gate |
| 11 | **commercial-strategist** | 상업성·전환·가격·앱스토어 적합성 평가 | 제품 화면·흐름·카피 | 상업성 평가 보고 | COMMERCIAL-gate |
| 12 | **workflow-integrity-auditor** | 메뉴 트리·탭 전환·작업 흐름·상태 전이 검증 | IA/flow 변경 | 흐름 무결성 보고 | FLOW-gate |
| 13 | **ux-navigation-auditor** | 시인성·탭 구조·모바일 내비게이션·시각적 계층 검수 | UI 스크린샷 | UX gap report | UX-gate |
| 14 | **runtime-reliability-auditor** | 실제 클릭 경로·콘솔 오류·네트워크 실패·성능 회귀 점검 | 실행 화면·로그 | 런타임 스모크 보고 | RUNTIME-gate |
| 15 | **red-team-monitor** | 유해정보·오남용·프롬프트 인젝션·의료 오판·청소년 리스크 상시 점검 | 제품 결과·프롬프트·E2E 로그 | red-team finding log | REDTEAM-gate (차단권) |
| 16 | **release-manager** | 모든 게이트 통과 확인·배포·롤백 플랜 | 모든 게이트 결과 | 릴리스 노트 + 배포 결정 | RELEASE-gate |

(0. orchestrator 는 위임 전용이며 직접 코드를 쓰지 않는다.)

---

## 3. 품질 게이트 (Blocking)

PR은 아래 게이트를 **순차적으로** 통과해야 머지·배포된다. 각 게이트는 GitHub Actions + 로컬 슬래시 커맨드 양쪽에서 실행 가능.

### Gate 1 — STATIC (자동, 30초)
- `npm run lint` 통과 (현재 ESLint config 미완성 → R-012)
- `tsc -b` 0 error
- Zod 스키마 vs `types/index.ts` 동기화 검사
- 비밀키 정규식 스캔 (`gitleaks` or `trufflehog`) 0건

### Gate 2 — CODE-REVIEW (code-reviewer, 2분)
- React 19 컴파일러 위반 패턴 없음
- 모든 외부 호출에 timeout / abort signal
- `any` 0건, `as unknown as` 사유 명시 (CurationResult.tsx 14행 위반 — R-013)

### Gate 3 — SECURITY (security-auditor, 5분, 차단권)
- 클라이언트 번들 정적 분석 → API 키 패턴 0건
- CSP 헤더 정의·검증 (`*.googleapis.com`, `generativelanguage.googleapis.com` 화이트리스트)
- Firestore Rules 시뮬레이션 테스트 (`firebase emulators:exec`)

### Gate 4 — PRIVACY (privacy-officer, 5분, 차단권)
- 신규 컬렉션/필드 ↔ 동의서 매트릭스 (`docs/legal/consent-matrix.md`) 1:1 매핑
- DSR(열람·정정·삭제·이동) 엔드포인트 존재 증명
- 14세 미만 가입 차단 로직 (PIPA §22-2)

### Gate 5 — LEGAL (legal-advisor, 비동기 ≤24h, 차단권)
- LLM 시스템 프롬프트의 "진단/처방" 어휘 금지 패턴 (`docs/legal/forbidden-phrases.txt`)
- OTC 추천 + 약국 결합 UI 변경 시 *의료광고 사전심의 대상 여부* 판단 첨부
- 다국어 disclaimer가 해당 국가 광고법과 모순되지 않음 (ko/en/zh/ja/es)

### Gate 6 — MEDICAL (medical-reviewer, 비동기 ≤48h, 차단권)
- 시스템 프롬프트 변경 시 회귀 프롬프트 셋(`docs/medical/regression-prompts.jsonl`) 100건 실행 후 임상적 정확도 ≥ 95%
- 식약처 OTC 마스터(`assets/mfds-otc.json`) 외 약품명 등장 시 차단
- redFlag 누락률 < 1% (응급 회귀셋 50건)

### Gate 7 — QA (qa-engineer, 10분)
- 유닛 커버리지 ≥ 80% (services/), ≥ 60% (components/)
- Playwright E2E: ① 정상 큐레이션, ② 응급 키워드, ③ 다국어 5종, ④ 비로그인/로그인 분기

### Gate 8 — RELEASE (release-manager)
- 1~7 모두 PASS + 변경 카테고리별 필수 승인자 라벨 부착
- 카나리 10% → 50% → 100% 단계적 배포 플랜 자동 생성
- 롤백 커맨드 명세 (이전 빌드 해시 + 캐시 무효화 절차) 첨부

---

## 4. 자동화 규칙 (Automation Rules)

오케스트레이터는 작업 의도를 분류해서 아래 규칙에 따라 자동 디스패치한다.

### R1. "Gemini 시스템 프롬프트 변경" 트리거
파일 패턴: `src/services/geminiService.ts` 의 `buildSystemPrompt` 또는 `forbidden-phrases.txt`
→ 자동 디스패치: `legal-advisor` + `medical-reviewer` + `qa-engineer(회귀)`
→ 게이트: LEGAL + MED + QA 필수

### R2. "Firestore 스키마/규칙 변경" 트리거
파일 패턴: `firestore.rules`, `src/services/symptomService.ts`, `src/firebase.ts`
→ 자동 디스패치: `privacy-officer` + `security-auditor`
→ 게이트: SEC + PRIV 필수, 동의서 매트릭스 diff 생성

### R3. "UI 카피 / 다국어 변경" 트리거
파일 패턴: `src/i18n/translations.ts`, `DisclaimerBanner.tsx`
→ 자동 디스패치: `ux-designer` + `legal-advisor`(다국어 광고법)
→ 게이트: LEGAL 필수

### R4. "신규 외부 API / 의존성 추가" 트리거
파일 패턴: `package.json`, `src/services/*.ts` 의 신규 fetch/SDK
→ 자동 디스패치: `security-auditor` + `legal-advisor`(데이터 국외이전 검토)
→ 게이트: SEC + LEGAL 필수

### R5. "응급/자살 키워드 로직 변경" 트리거
파일 패턴: `SymptomInput.tsx` 의 `EMERGENCY_KEYWORDS` 또는 redFlag 처리
→ 자동 디스패치: `medical-reviewer` + `legal-advisor`(보건복지부 자살예방 가이드)
→ 게이트: MED 필수, **product-strategist 거부권 가능**

### R6. "상업성/메뉴/전환 흐름 변경" 트리거
파일 패턴: `src/App.tsx`, `src/components/Header.tsx`, `src/components/*`, `src/i18n/translations.ts`
→ 자동 디스패치: `commercial-strategist` + `workflow-integrity-auditor` + `ux-navigation-auditor`
→ 게이트: COMMERCIAL + FLOW + UX 권장, 전환 저하 또는 메뉴 혼선 시 리워크

### R7. "항시 red-team 또는 runtime monitoring" 트리거
파일 패턴: `tests/e2e/**`, `tests/unit/**`, `playwright.config.*`, `vite.config.ts`, `src/services/**`, `src/components/**`
→ 자동 디스패치: `red-team-monitor` + `runtime-reliability-auditor` + `qa-engineer`
→ 게이트: REDTEAM + RUNTIME + QA 권장, 청소년 유해정보·오남용·실행 오류 발견 시 즉시 HOLD

---

## 5. 슬래시 커맨드 (개발자 진입점)

`.claude/commands/` 에 정의. Claude Code에서 `/<command>` 로 호출.

| 커맨드 | 동작 |
|---|---|
| `/review` | 현재 워킹트리 또는 PR 번호를 받아 Gate 1~2 + code-reviewer 풀 실행 |
| `/audit-security` | Gate 3 전용. 비밀키·CSP·Firestore Rules 일괄 점검 |
| `/audit-privacy` | Gate 4 전용. 동의 매트릭스 diff + DSR 점검 |
| `/audit-legal` | Gate 5 전용. 프롬프트·UI 카피 법적 검수 보고서 생성 |
| `/audit-medical` | Gate 6 전용. 회귀 프롬프트셋 실행 + 정확도 리포트 |
| `/qa` | Gate 7. Vitest + Playwright 풀 실행, 커버리지 리포트 |
| `/release` | Gate 1~7 결과 집계, 릴리스 노트 초안 + 카나리 플랜 출력 |
| `/monitor` | 상업성·흐름·UX·런타임·red team 결과를 모아 지속 모니터링 리포트 출력 |
| `/spawn <agent>` | 단일 에이전트 단독 호출 (디버그용) |
| `/ontology-check` | 코드 변경이 `ONTOLOGY.md` 와 동기화돼 있는지 검사 |

---

## 6. 디렉터리 구조 (이 하네스가 도입하는 것)

```
.
├── AGENTS.md                     ← 이 문서
├── docs/
│   ├── ontology/ONTOLOGY.md      ← 정식 도메인 온톨로지
│   ├── reviews/                  ← 코드리뷰·감사 결과 누적
│   │   └── CR-2026-06-01-initial.md
│   ├── legal/
│   │   ├── consent-matrix.md     ← 컬렉션↔동의서 매핑
│   │   ├── forbidden-phrases.txt ← 프롬프트 금지어
│   │   └── jurisdictions.md      ← ko/en/zh/ja/es 광고법 메모
│   ├── medical/
│   │   ├── regression-prompts.jsonl
│   │   └── redflag-suite.jsonl
│   └── monitoring/               ← 상업성/UX/flow/red-team 리포트 누적
├── .claude/
│   ├── agents/                   ← 16개 subagent 정의
│   ├── commands/                 ← 슬래시 커맨드
│   ├── workflows/release.yaml    ← GitHub Actions 동등 명세
│   └── policies/
│       ├── gates.yaml            ← 게이트 통과 기준 머신리더블
│       └── automation-rules.yaml ← 위 §4 머신리더블
└── src/ (기존)
```

---

## 7. 1차 코드리뷰 핵심 결론 (전체 보고: `docs/reviews/CR-2026-06-01-initial.md`)

| ID | 심각도 | 영역 | 요약 |
|---|---|---|---|
| R-001 | 🔴 CRITICAL | SEC | `VITE_GEMINI_API_KEY` 가 브라우저 번들에 노출됨. 즉시 서버 프록시화 필요 |
| R-002 | ✅ RESOLVED | PRIV | 검색 이력 서버 저장 제거. 사용자별 개인 디바이스 로컬 저장소에만 보관 |
| R-003 | 🔴 CRITICAL | LEGAL | OTC 추천 + 약국 위치 결합은 약사법 §50 *알선광고* 해석 가능. 분리 또는 면책 강화 필요 |
| R-004 | 🟠 HIGH | LEGAL | `recommendedDepartment` + `aiAdvice` 조합은 의료기기법 SaMD 분류 검토 대상 (MFDS 가이드라인 2022-9-30) |
| R-005 | 🟠 HIGH | MED | 자살/자해 키워드 시 119만 안내. **1393(자살예방상담전화)** + 1577-0199 누락 |
| R-006 | ~~🟠 HIGH~~ ❎ 각하 | BUILD | 의존성 버전 npm registry 교차검증 결과 전부 실존 (2026-06 기준 typescript 6.0.3, vite 8.0.16, react 19.2.6 등) |
| R-007 | 🟠 HIGH | SEC | Firestore Security Rules 파일 부재. 현재 어떤 규칙으로 배포됐는지 확인 불가 |
| R-008 | 🟡 MEDIUM | CODE | Gemini 응답 정규식 추출 후 Zod 검증 없음. 악성/형식오류 응답 UI 노출 가능 |
| R-009 | 🟡 MEDIUM | SEC | LLM 호출 레이트리밋 없음. 비용 폭주·DoS 위험 |
| R-010 | 🟡 MEDIUM | PRIV | 캐시 키에 증상 텍스트 평문 사용. 메모리지만 sourcemap+덤프 시 노출 |
| R-011 | 🟡 MEDIUM | UX | disclaimer 다국어 번역만 있고 *법적 효력 고지*는 ko 기준. 타국 사용 시 모호 |
| R-012 | 🟡 MEDIUM | CODE | `eslint.config.js` 존재하지만 `npm run lint` CI 미연결 |
| R-013 | 🔵 LOW | CODE | `CurationResult.tsx:14` `as unknown as Record<string, string>` 캐스팅. 타입 안전성 우회 |
| R-014 | 🔵 LOW | UX | Error Boundary 없음. LLM 실패 시 화이트스크린 가능 (현재 try/catch 로 부분 방어) |

각 항목은 위 자동화 규칙에 따라 해당 에이전트에게 자동 위임된다.

---

## 8. 시작하기 (개발자/에이전트 공용)

```bash
# 1) 현재 코드 상태 검수
/review

# 2) 보안·개인정보 감사
/audit-security && /audit-privacy

# 3) 법적·임상 검수 (비동기, ≤48h)
/audit-legal && /audit-medical

# 4) QA
/qa

# 5) 릴리스 가능 여부 판단
/release
```

각 커맨드는 결과를 `docs/reviews/` 에 타임스탬프된 마크다운으로 누적해서 감사추적(audit trail) 을 남긴다.

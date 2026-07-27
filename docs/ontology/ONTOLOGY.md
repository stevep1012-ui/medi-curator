# medi-curator 도메인 온톨로지

> **상태**: v1.0 · 2026-06-01 · maintainer: orchestrator-agent
> **목적**: 코드·UI·LLM 프롬프트·법적 문서가 동일한 개념 모델 위에서 정렬되도록 강제한다.
> **변경 규칙**: 본 문서 변경 PR 은 `legal-advisor` + `medical-reviewer` + `frontend-architect` 3인 승인 필요.

---

## 1. 최상위 카테고리

| 카테고리 | 정의 | 코드 위치 |
|---|---|---|
| **Actor** | 시스템과 상호작용하는 주체 | `contexts/AuthContext.tsx` |
| **Artifact** | 시스템이 생성·저장·교환하는 데이터 객체 | `types/index.ts` |
| **Process** | Actor가 Artifact를 변환하는 동작 | `services/*.ts` |
| **Regulation** | Process를 제약하는 외부 규범 | `docs/legal/` |
| **Surface** | Artifact를 Actor에게 노출하는 UI | `components/*.tsx` |
| **Commercialization** | 제품이 사용자의 목적 달성, 전환, 신뢰, 재방문을 지원하는 방식 | `App.tsx`, `components/*`, `docs/reviews/*` |

---

## 2. 클래스 정의

### 2.1 Actor

#### `EndUser` (anonymous)
- 속성: `language: Language`, `theme: Theme`, `position?: GeolocationPosition`
- 권한: Curation 호출, Pharmacy 조회. **Firestore 쓰기 불가**.
- 보존: 세션 종료 시 폐기.

#### `AuthenticatedUser extends EndUser`
- 속성: `uid: string`, `consent: ConsentRecord`
- 권한: 자기 디바이스의 로컬 검색 이력 CRUD.
- 보존: 로컬 검색 이력은 사용자 직접 삭제 또는 탈퇴 시 해당 디바이스에서 삭제.

#### `EmergencyContact` (탐색용 가상 Actor)
- 인스턴스: `119` (응급의료), `1393` (자살예방), `1577-0199` (정신건강위기), `129` (보건복지콜)
- 트리거: `RedFlag.severity >= HIGH`

### 2.2 Artifact

#### `SymptomQuery`
```ts
{
  symptoms: string;            // 3자 이상, 4096자 이하
  currentMedications: string;  // 선택
  language: Language;          // ko|en|zh|ja|es
  age?: string;                // pro 모드에서만 유의
  consentVersion: string;      // 동의서 버전 해시
}
```
- **PIPA 등급**: 민감정보 (질병·건강에 관한 정보, §23). 별도 동의 필수.
- **서버 저장 금지**: 출시 1차에서는 Firestore 저장 없이 개인 디바이스 로컬 이력에만 보관.

#### `CurationResult` (LLM 출력)
타입은 9개 필드를 선언하지만 **사용자에게 실제로 전달되는 값은 4개뿐이다.**
서버 `safeResult()`(`functions/src/index.ts`)가 응답 직전 나머지를 항상 비운다(법적 포지션).

전달되는 필드:
- `recommendedDepartment`: `string` (≤100자). ⚠️ 계획은 "식약처 표준 진료과 36종 화이트리스트"
  였으나 **현재는 enum 이 아닌 자유 문자열**이다(`src/schemas/curation.ts`). 화이트리스트 미구현.
- `aiAdvice`: `string` (≤2000자). 진단·처방 어휘는 `violatesForbidden()`(`functions/src/shared.ts`)
  이 응답 전체를 대상으로 차단한다.
- `redFlags: string[]`
- `disclaimer: string` (필수 — INV-1, `src/schemas/curation.ts` 의 `min(10)` 으로 강제)

항상 비워져 전달되는 필드 (타입·스키마 계약은 유지, 프롬프트는 더 이상 요구하지 않음):
- `otcMedications: OTCMedication[]`, `folkRemedies: string[]`, `lifestyleTips: string[]`,
  `exercisePrescription: ExercisePlan`, `recoveryTimeline: RecoveryTimeline[]`

> 의료광고 사전심의 후 노출을 재개하려면 ① 프롬프트에 필드 복원 ② `safeResult()` 통과
> ③ 클라이언트 렌더 블록 복원 ④ INV-3 교차검증 구현이 함께 필요하다.

#### `OTCMedication`
- `name`, `purpose`, `dosage`, `warnings[]`, `interactions?[]`, `riskLevel: low|medium|high`
- **불변식**: `interactions` 가 비어있어도 사용자의 `currentMedications` 가 비어있지 않으면 `aiAdvice` 에 "상호작용 가능성 약사 확인 필요" 문구 포함 필수.

#### `PharmacyRecord`
- **Kakao Local "카테고리로 장소 검색"(PM9=약국) 출처.** REST 키는 서버 시크릿으로만 두고
  `functions/src/pharmacies.ts` 프록시를 경유한다(브라우저 미노출).
  구현: `src/services/pharmacyService.ts`, `functions/src/pharmacies.ts`.
  (이전 문서의 "Google Places / `placeId`" 서술은 실제 구현과 달라 정정함.)
- **금지**: OTC 추천 결과와 동일 화면에 결합 시 *알선광고* 해석 위험. 별도 탭으로 분리 (현재 구조 OK
  — 게다가 현재 OTC 는 서버에서 항상 비워져 결합 자체가 발생하지 않는다).

#### `AuditLogEntry`
- 동의 변경·DSR 요청 기록. **불변(append-only)**, 5년 보존 (PIPA 시행령 §16). 건강 이력 원문은 포함하지 않는다.

#### `ConsentRecord`
- `version`, `acceptedAt`, `items: {pii: bool, sensitiveHealth: bool, marketing: bool, overseasTransfer: bool}`
- 14세 미만 차단 + 법정대리인 동의 워크플로(현재 미구현 — R-FUTURE).

### 2.3 Process

| 프로세스 | 입력 → 출력 | 제약 | 책임 모듈 |
|---|---|---|---|
| `Curate` | `SymptomQuery` → `CurationResult` | LLM 서버사이드, Zod 검증, 캐시 5분 | `services/geminiService.ts` → **서버 프록시로 이전 예정** |
| `LocatePharmacy` | `(lat,lng)` → `Pharmacy[]` | KR 한정, 반경 3km, 30회/시간 레이트 | `services/pharmacyService.ts` |
| `PersistHistory` | `(uid, CurationResult)` → `localRecordId` | `consent.sensitiveHealth=true` 일 때만 | `services/symptomService.ts` |
| `EscalateEmergency` | `string` → `RedFlag` | 키워드 + LLM 분류 이중 판정 | `SymptomInput.tsx` + `geminiService` |
| `RevokeConsent` | `uid` → `void` | 24h 내 모든 데이터 삭제 + 백업 30일 폐기 | **미구현** |

### 2.4 Regulation (각 Process가 만족해야 하는 정규화된 제약)

| Regulation | 핵심 조항 | 영향받는 Process | 위반 시 |
|---|---|---|---|
| **PIPA** | §15(수집), §22(동의), §23(민감정보), §28-2(가명처리), §39(손해배상) | Curate, PersistHistory | 과징금·집단소송 |
| **약사법** | §44(판매장소), §50(약국외판매·알선광고), §61(과대광고) | LocatePharmacy + Curate 결합 | 형사처벌·과징금 |
| **의료법** | §27(무면허 의료행위), §56(의료광고 사전심의) | Curate (의학적 결론 제시) | 형사처벌 |
| **의료기기법** | §2(정의), SaMD 가이드라인 2022-9-30 | Curate (질병 진단·치료 보조 시) | 인허가 대상화 |
| **MFDS OTC 마스터** | 식약처 일반의약품 데이터베이스 | OTCMedication.name | 처방의약품 노출 시 위법 |
| **자살예방법** | §13(상담전화 안내 의무) | EscalateEmergency | 행정처분 |

### 2.5 Surface (UI 컴포넌트와 Artifact 매핑)

모두 `src/app/components/` 아래 실재하는 파일이어야 한다.

```
Chrome                ← Actor.language, Actor.theme  (isProMode 는 현재 배선 없음 — 아래 주 참고)
Legal / LegalModal    ← Regulation 의 필수 고지 (약관·개인정보처리방침)
SymptomAnalysis       ← SymptomQuery 입력 + EmergencyEscalation 트리거 + CurationResult 렌더
                        (렌더 필드는 4개: recommendedDepartment, aiAdvice, redFlags, disclaimer)
PharmacyFinder        ← PharmacyRecord[] 렌더 (별도 탭, OTC와 시각적 분리)
SearchHistory         ← AuthenticatedUser 전용
TabNav                ← MenuTree 탭 전환
```

> **주.** 이전 문서의 `SymptomInput` / `Header` / `DisclaimerBanner` 는 실재하지 않는 이름이었다.
> `src/components/SymptomInput.tsx` 는 렌더되지 않는 사본이어서 2026-07-26 정리 시 삭제했고,
> 출하 경로는 `src/app/components/SymptomAnalysis.tsx` 다.
> `isProMode` 는 모든 호출부가 `false` 리터럴을 넘겨 실질적으로 죽은 배선이다.

### 2.6 Commercialization & Monitoring

#### `CommercialReadinessReport`
- 상업성, 전환, 신뢰, 메뉴 무결성, runtime 상태, red-team 요약 보고서.
- 생성 주체: `commercial-strategist`, `workflow-integrity-auditor`, `ux-navigation-auditor`, `runtime-reliability-auditor`, `red-team-monitor`

#### `MenuTree`
- 사용자가 실제로 밟는 화면 전이 그래프.
- 검증 포인트: 3탭 이내 목적 도달, dead-end 없음, 응급 우선, 상담/기록/약국의 역할 분리.

#### `RedTeamFinding`
- 유해정보, 오남용, 청소년 리스크, 의료 오판, 프롬프트 인젝션, 응급 누락에 대한 발견 사항.
- 상태: `PASS | WATCH | BLOCK`

#### `RuntimeSmoke`
- 실제 클릭 경로에서 발생한 콘솔/네트워크/렌더 오류와 성능 이슈.
- 목표: 사용자가 기능을 "설명"이 아니라 "실행"으로 체감할 수 있어야 함.

---

## 3. 불변식 (Invariants)

코드·테스트가 강제해야 하는 시스템 전역 규칙.
**강제 지점이 없는 규칙은 "미구현"으로 표기한다** — 강제되지 않는 규칙을 강제되는 것처럼
적어 두면 잘못된 안심을 준다. 상태는 `tests/unit/ontologySync.test.ts` 가 함께 검사한다.

| ID | 규칙 | 상태 | 강제 지점 |
|---|---|---|---|
| **INV-1** | `disclaimer` 비어 있으면 렌더 금지 | ✅ 강제됨 | `src/schemas/curation.ts` `disclaimer: z.string().min(10)` |
| **INV-2** | `SymptomQuery` 저장 시 `sensitiveHealth === true` | ✅ 강제됨(우회) | `src/services/symptomService.ts` 가 증상·결과를 **아예 저장하지 않음**(PIPA §23). 서버는 `requireAuthenticatedConsent()` 로 동의 확인 |
| **INV-3** | `OTCMedication.name` 을 식약처 마스터와 교차검증 | ❌ **미구현** | `assets/mfds-otc.json` 파일이 존재하지 않고 참조 코드도 없음. 현재 OTC 는 서버가 항상 비워 노출 자체가 없으나, 노출 재개 시 **선행 구현 필수** |
| **INV-4a** | 응급 시 위기 번호 노출 | ✅ 강제됨 | `src/lib/emergency.ts` `HOTLINES`. **번호는 109 + 1577-0199**(정신) / 119(신체). 옛 `1393` 은 2024년 109 로 통합되어 더 이상 쓰지 않는다 |
| **INV-4b** | 응급 시 `pharmacy` 탭 hidden | ❌ **미구현** | `isCrisis` 는 `SymptomAnalysis.tsx` 내부에서만 쓰이며 `TabNav` 에 필터가 없어 위기 상태에서도 약국 탭 접근 가능 |
| **INV-5** | 비한국어 `disclaimer` 에 영문 면책 병기 | ⚠️ 미검증 | 강제 지점 확인 필요 |
| **INV-6** | 모든 LLM 호출 서버 경유 | ✅ 강제됨 | 클라이언트는 `/api/curate`·`/api/ai/*` 프록시만 호출. 레드팀 RT-NL-007 이 검사 |
| **INV-7** | `currentMedications` 있으면 약사 확인 문구 필수 | ❌ **미구현** | 클라이언트·서버 어디에도 강제 지점 없음 |

---

## 4. 변경 영향 매트릭스 (Change Impact)

| 변경 대상 | 자동 트리거되는 에이전트 |
|---|---|
| `geminiService.ts` 프롬프트 | legal-advisor, medical-reviewer, qa-engineer |
| `types/index.ts` 스키마 | frontend-architect, qa-engineer, medical-reviewer |
| Firestore 컬렉션·필드 | privacy-officer, security-auditor |
| `package.json` 의존성 | security-auditor, legal-advisor(국외이전) |
| `i18n/translations.ts` | ux-designer, legal-advisor |
| 응급 키워드 | medical-reviewer, legal-advisor, product-strategist |
| `App.tsx` / `components/*` / 메뉴 구조 | commercial-strategist, workflow-integrity-auditor, ux-navigation-auditor, red-team-monitor |

---

## 5. 용어 사전 (Glossary)

- **OTC**: Over-the-counter, 한국 약사법 상 일반의약품 (처방전 불요).
- **SaMD**: Software as a Medical Device. 진단·치료 보조 의도가 있는 SW.
- **DSR**: Data Subject Request — 정보주체의 열람·정정·삭제·이동 요구권.
- **DPIA**: Data Protection Impact Assessment, 개인정보영향평가.
- **EBM**: Evidence-Based Medicine.
- **MFDS**: 식품의약품안전처 (Ministry of Food and Drug Safety).

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
8개 필드. **모든 필드 Zod 스키마 강제 검증**:
- `recommendedDepartment`: enum (내과·정형외과·소아과·... 식약처 표준 진료과 36종 화이트리스트)
- `aiAdvice`: `string` (≤ 2000자, 진단·처방 어휘 금지 — `forbidden-phrases.txt`)
- `otcMedications: OTCMedication[]` (각 항목 `name` 은 `assets/mfds-otc.json` 마스터와 교차검증)
- `folkRemedies: string[]` (의학적 근거 없음 표기 의무)
- `lifestyleTips: string[]`
- `exercisePrescription: ExercisePlan`
- `recoveryTimeline: RecoveryTimeline[]`
- `redFlags: string[]`
- `disclaimer: string` (필수, 비어있을 수 없음)

#### `OTCMedication`
- `name`, `purpose`, `dosage`, `warnings[]`, `interactions?[]`, `riskLevel: low|medium|high`
- **불변식**: `interactions` 가 비어있어도 사용자의 `currentMedications` 가 비어있지 않으면 `aiAdvice` 에 "상호작용 가능성 약사 확인 필요" 문구 포함 필수.

#### `PharmacyRecord`
- Google Places 출처. `placeId` 만 신뢰 식별자.
- **금지**: OTC 추천 결과와 동일 화면에 결합 시 *알선광고* 해석 위험. 별도 탭으로 분리 (현재 구조 OK).

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

```
Header                ← Actor.language, Actor.theme, isProMode
DisclaimerBanner      ← Regulation 의 필수 고지 (모든 화면 상단)
SymptomInput          ← SymptomQuery 입력 + EmergencyEscalation 트리거
CurationResult        ← CurationResult 8개 필드 렌더
PharmacyFinder        ← Pharmacy[] 렌더 (별도 탭, OTC와 시각적 분리)
SearchHistory         ← AuthenticatedUser 전용
```

---

## 3. 불변식 (Invariants)

코드·테스트가 강제해야 하는 시스템 전역 규칙.

- **INV-1**: `CurationResult.disclaimer` 비어 있으면 `<CurationResult/>` 렌더 금지.
- **INV-2**: `SymptomQuery` 가 Firestore에 저장될 때 `ConsentRecord.items.sensitiveHealth === true` 여야 함.
- **INV-3**: `OTCMedication.name` 이 식약처 OTC 마스터에 없으면 렌더 차단 + medical-reviewer 알림.
- **INV-4**: 응급 키워드 매칭 시 1393/119 양쪽 노출 + `pharmacy` 탭은 hidden.
- **INV-5**: `language !== 'ko'` 일 때 `disclaimer` 는 해당 언어 + 한국 법적 면책 영문 병기.
- **INV-6**: 모든 LLM 호출은 서버사이드 경유 (브라우저 fetch 직접 호출 금지).
- **INV-7**: `interactions` 가 비어 있어도 `currentMedications` 비어있지 않으면 약사 확인 권고 문구 포함.

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

---

## 5. 용어 사전 (Glossary)

- **OTC**: Over-the-counter, 한국 약사법 상 일반의약품 (처방전 불요).
- **SaMD**: Software as a Medical Device. 진단·치료 보조 의도가 있는 SW.
- **DSR**: Data Subject Request — 정보주체의 열람·정정·삭제·이동 요구권.
- **DPIA**: Data Protection Impact Assessment, 개인정보영향평가.
- **EBM**: Evidence-Based Medicine.
- **MFDS**: 식품의약품안전처 (Ministry of Food and Drug Safety).

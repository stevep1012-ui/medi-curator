# 동의 매트릭스 — 수집 항목 ↔ 사용처 ↔ 법적 근거

> **유지 책임**: privacy-officer 에이전트.
> **변경 시**: 동의서 UI (가입 / 첫 호출 / 갱신) 동시 변경 필수.

| 수집 항목 | 사용처 (Process) | 컬렉션/저장소 | 법적 근거 | 동의 카테고리 | 보존기간 | DSR 지원 |
|---|---|---|---|---|---|---|
| 이메일·소셜 프로필 | 인증 | Firebase Auth (Google/Apple/Kakao OIDC) | PIPA §15 ① 동의 | 필수 | 탈퇴 시 즉시 | 열람·삭제 |
| 증상 텍스트 | LLM Curate | 메모리(캐시 5분) → 서버 프록시 | PIPA §23 ① 별도 동의 | 민감/필수 | 캐시 만료 즉시 | -- |
| 증상 텍스트 (이력) | PersistHistory | 개인 디바이스 localStorage `medi-curator:searchHistory:{uid}` | PIPA §23 ① 별도 동의 | 민감/선택 | 사용자 직접 삭제까지 | 로컬 열람·삭제·이동 |
| 복용 약물 | LLM Curate | 동상 | PIPA §23 ① 별도 동의 | 민감/필수 | 동상 | 동상 |
| 위치(GPS) | LocatePharmacy | 메모리 (저장 안 함) | 위치정보법 §15 별도 동의 | 위치/필수 | 세션 종료 즉시 | -- |
| 검색 언어·테마 | UX | localStorage | PIPA §15 동의 | 선택 | 사용자 삭제까지 | 삭제 |
| 호출 로그 (audit) | 감사 | Firestore `auditLogs` | PIPA §29 안전조치 | 의무 | 5년 (시행령 §16) | -- (가명) |

## 국외이전 고지

- **Google Gemini API** (US, Multi-region): 증상·약물 텍스트가 추론 시점에 전송됨.
- **Firebase Auth/Firestore** (US, asia-northeast3 가능): 소셜 인증 식별자·동의·감사로그 저장. 건강 이력은 서버 저장 안 함.
- **Google Places API** (US): 위치 좌표 전송.

위 항목은 회원가입 시 별도 체크박스 필수 (PIPA §28-8 국외이전 동의).

## 14세 미만

PIPA §22-2: 가입 차단 (생년월일 입력) 또는 법정대리인 동의 절차.
**현재 미구현 → R-FUTURE-1**.

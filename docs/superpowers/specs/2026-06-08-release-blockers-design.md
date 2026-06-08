# Release Blockers Design

## Goal

외부 법무·임상 서면 승인 전에도 코드로 해결 가능한 출시 차단 항목을 완료한다.

## Scope

1. Firebase App Check 토큰을 클라이언트가 `/api/curate`에 전달한다.
2. Cloud Function은 App Check 토큰, Firebase Auth, 최신 민감정보 동의를 모두 검증한다.
3. 사용자별 시간당 요청 수를 Firestore 트랜잭션으로 중앙 관리한다.
4. 개인정보처리방침과 이용약관을 앱에서 열 수 있게 한다.
5. 사업자 정보가 미확정인 동안 production build/deploy gate를 실패시킨다.

## Architecture

### App Check

- 클라이언트는 Firebase runtime config로 초기화된 앱에 App Check를 연결한다.
- production은 `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`를 요구한다.
- 개발 환경에서는 App Check가 설정되지 않아도 UI 개발이 가능하다.
- `/api/curate` 요청은 `X-Firebase-AppCheck` 헤더를 포함한다.
- 서버는 Admin SDK의 `appCheck().verifyToken()`으로 토큰을 검증한다.
- App Check 실패는 `401 APP_CHECK_REQUIRED`로 종료하며 Gemini를 호출하지 않는다.

### Central Rate Limit

- 기존 인스턴스 메모리 `Map`은 제거한다.
- Firestore `rateLimits/{uid}:{hourBucket}` 문서를 사용한다.
- Admin SDK transaction으로 count를 원자적으로 증가시킨다.
- 시간당 30회 초과 시 `429 RATE_LIMIT`을 반환한다.
- 문서에는 `uid`, `count`, `windowStart`, `expiresAt`만 저장한다.
- 건강정보와 요청 본문은 저장하지 않는다.

### Policy Pages

- 앱 내부 `policy` 탭에서 개인정보처리방침과 이용약관을 표시한다.
- 정책에는 처리 목적, 항목, 보유기간, 국외이전, DSR, 위치정보 선택 동의를 명시한다.
- 사업자명, 대표자, 주소, 개인정보 보호책임자, 문의 이메일은
  `[출시 전 확정 필요]`로 표시한다.
- 이 placeholder가 남아 있으면 production readiness 검사와 release gate가 실패한다.

## Build Gate

`scripts/check-release-readiness.mjs`가 다음을 검사한다.

- 정책 파일의 필수 사업자 정보가 placeholder가 아닌지 확인
- production App Check site key 존재 확인
- Firebase 프로젝트 ID가 placeholder가 아닌지 확인

`npm run gate:release-readiness`로 독립 실행하며, `npm run gate:release`에서
정적 검사 이후 실행한다.

일반 `npm run build`는 개발 검증을 위해 유지한다. 실제 배포 명령과 release
gate만 placeholder 상태를 차단한다.

## Error Handling

- App Check 누락/오류: `401`, 사용자는 새로고침 후 다시 로그인하도록 안내한다.
- 인증 누락/오류: 기존 `401` 처리 유지.
- 동의 누락: 기존 `403` 처리 유지.
- Firestore quota transaction 실패: `503 RATE_LIMIT_UNAVAILABLE`; LLM 호출 금지.
- 정책 placeholder: 배포 전 검사에서 실패하며 앱 실행에는 영향이 없다.

## Testing

- 소스 단위 테스트로 App Check가 Auth보다 먼저 검증되는지 확인한다.
- 중앙 레이트리밋 helper를 순수 함수와 저장소 인터페이스로 분리해 경계값을 테스트한다.
- 클라이언트 서비스 테스트에서 App Check 헤더와 오류 메시지를 검증한다.
- 정책 placeholder 검사 스크립트는 fixture 기반으로 통과/실패를 검증한다.
- 기존 lint, build, Functions build, coverage, E2E를 모두 재실행한다.

## Out Of Scope

- 실제 사업자 정보 확정
- 한국 의료·약사 전문 변호사 서면 의견
- 의사·약사 임상 검토 승인
- MFDS 규제 분류 사전 질의
- reCAPTCHA Enterprise site key의 실제 Firebase Console 발급

위 항목은 외부 확인 없이는 PASS 처리하지 않는다.

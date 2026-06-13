# RELEASE-BLOCKERS-2026-06-08

## Decision

**HOLD**

코드로 해결 가능한 App Check, 중앙 사용자 할당량, 정책 화면, release readiness
차단 검사는 구현됐다. 실제 사업자 정보, production App Check site key, 외부
법무·임상 서면 승인이 없으므로 공개 출시는 계속 보류한다.

## Resolved

| Finding | Result | Evidence |
|---|---|---|
| 비인증 클라이언트 직접 호출 | PASS | Auth + 최신 민감정보 동의 서버 검증 |
| App Check 부재 | PASS in code | Web token header + Admin `verifyToken` |
| 인스턴스 메모리 레이트리밋 | PASS in code | Firestore transaction, UID당 시간당 30회 |
| 건강정보 quota 저장 위험 | PASS | quota 문서는 uid/count/window/expiry만 저장 |
| 정책 링크 부재 | PASS | 앱 푸터와 개인정보 화면에서 정책 문서 접근 |
| 사업자 placeholder 배포 | BLOCK enforced | `gate:release-readiness`가 production 배포 차단 |

## Verification

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm --prefix functions run build` | PASS |
| `npm run scan:secrets` | PASS |
| `npm run scan:bundle` | PASS |
| Vitest coverage | PASS, 11 files / 39 tests |
| Coverage | 93.18% lines, 89.39% branches |
| Playwright | PASS, 5 tests |
| Readiness script tests | PASS, 4 tests |
| `npm run gate:release-readiness` | EXPECTED BLOCK |

## Current Readiness Blocks

1. `config/release-profile.json`의 사업자명, 대표자, 주소, 개인정보 보호책임자,
   개인정보 문의 이메일이 `[출시 전 확정 필요]` 상태다.
2. `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`가 production 환경에 설정되지 않았다.
3. Firebase Console에서 Web App Check provider 등록과 enforcement 활성화 증거가 없다.
4. `rateLimits.expiresAt` Firestore TTL 정책 배포 증거가 없다.
5. 한국 의료·약사 전문 변호사 서면 의견과 의사·약사 임상 검토 승인이 없다.
6. MFDS 규제 분류 사전 질의와 50건/100건 의료 회귀셋 승인 근거가 없다.

## Release Condition

다음 명령이 exit code 0이 되기 전에는 Hosting production 배포를 실행하지 않는다.

```bash
npm run gate:release
```

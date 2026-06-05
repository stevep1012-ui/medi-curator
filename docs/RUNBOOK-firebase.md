# Firebase Hosting + Functions 배포 RUNBOOK

> 이 파일은 한 번 보고 그대로 따라 치면 medi-curator 가 프로덕션에서 동작하도록 설계된 절대경로 가이드다.
> Vercel 어댑터(`api/curate.ts`)는 폐기되었음. 단일 소스 = Firebase.

## 0. 사전 준비 (한 번만)

```bash
# Firebase CLI 전역 설치
npm install -g firebase-tools

# 로그인 (브라우저 OAuth)
firebase login

# 프로젝트 ID 확인 (없으면 https://console.firebase.google.com 에서 생성)
firebase projects:list
```

`.firebaserc` 의 `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` 를 실제 프로젝트 ID 로 교체.

```bash
sed -i '' 's/REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID/your-project-id/' .firebaserc
```

또는 즉시 적용:
```bash
firebase use your-project-id
```

## 1. 시크릿 등록 (Gemini API Key)

```bash
firebase functions:secrets:set GEMINI_API_KEY
# 프롬프트에 https://aistudio.google.com/apikey 에서 발급한 키 붙여넣기
```

⚠️ **클라이언트 코드 / dist 번들에 키가 절대 들어가면 안 된다.** `.env.local` 의 `VITE_GEMINI_API_KEY` 는 **제거**해도 됨 (서버 프록시가 대체). 남겨두면 SEC-gate 가 BLOCK.

## 2. Firestore Rules / Indexes 배포

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 3. Functions 빌드 + 배포

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```

배포 후 출력되는 URL:
```
https://asia-northeast3-<project>.cloudfunctions.net/curate
```

이 URL 은 직접 호출하지 말고 호스팅 리라이트(`/api/curate`)를 통해서만 사용.

## 4. 호스팅 (정적 SPA) 배포

```bash
npm run build           # vite build → dist/
node scripts/scan-bundle.mjs dist   # SEC-gate: 비밀키 노출 검사
firebase deploy --only hosting
```

## 5. 로컬 에뮬레이터로 통합 테스트

```bash
# 1터미널: functions watch
cd functions && npm run build:watch

# 2터미널: 에뮬레이터
firebase emulators:start

# 3터미널: vite dev (프록시 설정 필요 — 아래 6번 참조)
npm run dev
```

에뮬레이터 UI: http://127.0.0.1:4000

## 6. Vite dev 서버에서 /api/curate 프록시

개발 중 `npm run dev` 가 5173 포트, Functions 에뮬레이터가 5001 포트라 프록시가 필요. `vite.config.ts` 에 추가:

```ts
server: {
  proxy: {
    '/api/curate': {
      target: 'http://127.0.0.1:5001/<PROJECT_ID>/asia-northeast3/curate',
      changeOrigin: true,
      rewrite: () => '',
    },
  },
},
```

## 7. 단계적 배포 (카나리, release-manager 게이트)

Firebase Hosting 은 기본 채널 외 **프리뷰 채널**을 지원한다.

```bash
# 1) 프리뷰 채널 (Pull Request 단위)
firebase hosting:channel:deploy pr-123 --expires 7d
# → https://<project>--pr-123-<hash>.web.app

# 2) 운영 배포 (전체 100%)
firebase deploy --only hosting

# 3) 롤백 (이전 릴리스 promote)
firebase hosting:releases:list
firebase hosting:releases:rollback
```

Firebase Hosting 은 트래픽 분할(10/50/100)을 네이티브 지원하지 않음. 단계적 출시가 필요하면 release-manager 는 다음 옵션 중 하나 선택:
- (a) 프리뷰 채널에 내부 dogfood → 운영 전체 promote
- (b) Cloudflare 등 외부 LB 앞단에 두고 가중치 분할
- (c) functions 단의 feature flag (예: `?canary=1` 쿼리 또는 사용자 UID 해시 모듈로)

## 8. 운영 모니터링

```bash
firebase functions:log --only curate          # 최근 로그
firebase functions:log --only curate -n 100   # 100줄
```

`curate.start / curate.ok / curate.upstream_error / curate.schema_fail / curate.forbidden / curate.exception` 6가지 이벤트가 구조화 로그로 남는다.

Google Cloud Logging 콘솔에서 `traceId` 로 필터링하면 단일 요청 추적 가능.

## 9. 게이트 통과 확인 (CI 와 동일하게 로컬에서)

```bash
# STATIC
node scripts/scan-secrets.mjs && npx tsc -b --noEmit && npm run lint

# SEC (번들)
npm run build && node scripts/scan-bundle.mjs dist

# Functions 빌드
cd functions && npm run build && cd ..

# QA (현재 미구현 — qa-engineer 셋업 후)
# npm test && npm run test:e2e
```

## 10. 비용 상한 (안전장치)

Firebase Console → 사용량 및 결제 → 예산 알림:
- Functions: 월 $20 알림 / $50 한도
- Firestore: 월 $10 알림
- Hosting: 월 $5 알림 (CDN 트래픽)

Gemini API 는 Google AI Studio 콘솔에서 분당/분기별 쿼터 설정.

---

## 자주 막히는 곳

| 증상 | 원인 | 해결 |
|---|---|---|
| 배포 시 `Error: HTTP Error: 403, Permission denied` | 프로젝트 ID 오타 또는 Billing 미설정 | Blaze 요금제 활성화 필요 (Functions v2 는 Spark 불가) |
| `Cannot find module 'firebase-functions/v2/https'` | `functions/` 에서 `npm install` 누락 | `cd functions && npm install` |
| `curate` 호출 시 500 `EXCEPTION` | `GEMINI_API_KEY` 미등록 | `firebase functions:secrets:set GEMINI_API_KEY` |
| 클라이언트에서 CORS 오류 | `/api/curate` 리라이트가 안 걸림 | 호스팅 도메인으로 접속했는지 확인. Functions URL 직접 호출 금지 |
| dev 에서 /api/curate 가 404 | vite proxy 미설정 | §6 참조 |

# RUNBOOK — 시험(테스트) 서비스 호스팅 방법 비교

medi-curator는 **Firebase Hosting 전용 설계**다(런타임 config `/__/firebase/init.json`,
`/api/*` → Functions rewrite, App Check 도메인 바인딩). 따라서 "시험 서비스"를 어디에
띄우느냐에 따라 **실제로 동작하는 범위가 달라진다**. 아래에서 골라 쓴다.

| 방법 | 동작 범위 | 클라우드/시크릿 | HOLD 적합도 |
|------|----------|----------------|------------|
| **A. 로컬 Firebase 에뮬레이터** (권장) | 전 기능(인증/동의/AI*) 로컬 | 불필요(오프라인 demo 프로젝트) | ★★★ 최적 |
| B. Firebase Hosting 프리뷰 채널 | 전 기능, 임시 공개 URL | Firebase 프로젝트+시크릿+App Check 필요 | ★★ (외부 설정 필요) |
| C. Render / Vercel / Netlify / Cloudflare Pages / GitHub Pages | **UI 미리보기만** | 빌드타임 공개키만 | ★ (백엔드 미동작) |

> *로컬 에뮬레이터의 AI 분석(`/api/curate`)은 Gemini 키와 App Check 디버그 토큰이
> 추가로 필요하다. 인증·동의·UI·다국어·응급감지 등은 키 없이도 완전히 동작한다.

---

## A. 로컬 Firebase 에뮬레이터 (권장 — 클라우드/공개 노출 없음)

오프라인 `demo-` 프로젝트라 **실제 Firebase 프로젝트가 없어도** 된다.

```bash
# 0) firebase CLI (1회)
npm i -g firebase-tools          # 또는 npx firebase-tools ... 사용

# 1) functions 빌드
npm --prefix functions ci && npm --prefix functions run build

# 2) 터미널 1 — 에뮬레이터(auth 9099 / firestore 8080 / functions 5001 / UI 4000)
firebase emulators:start --project demo-medi-curator

# 3) 터미널 2 — Vite 개발 서버 (init.json 제공 + /api/curate → 5001 프록시)
npm run dev
# → http://localhost:5173 접속. 에뮬레이터 UI: http://localhost:4000
```

AI 분석까지 시험하려면:
- `functions/.env`(로컬, 커밋 금지)에 `GEMINI_API_KEY=...`
- App Check 디버그 토큰: 브라우저 콘솔에서 `self.FIREBASE_APPCHECK_DEBUG_TOKEN=true`
  후 발급 토큰을 Firebase 콘솔(또는 에뮬레이터)에서 허용. 없으면 curate는 401(앱 무결성)로
  우아하게 실패하고 나머지는 정상.

## B. Firebase Hosting 프리뷰 채널 (실동작 + 임시 공개 URL)

native로 init.json·/api rewrite·App Check가 모두 동작한다. 단 실제 Firebase
프로젝트와 시크릿이 필요(HOLD 외부 항목).

```bash
firebase login
firebase use --add                       # 실제 프로젝트 선택 → .firebaserc 생성
# functions 시크릿
firebase functions:secrets:set GEMINI_API_KEY
# 프리뷰 채널 배포(예: 7일 만료)
npm run build && npm --prefix functions run build
firebase hosting:channel:deploy test --expires 7d
# → https://<project>--test-xxxx.web.app 임시 URL 발급
```
추가로: App Check에서 프리뷰 도메인 등록, reCAPTCHA Enterprise 키 설정 필요.

## C. 정적 호스트(Render/Vercel/Netlify/Cloudflare Pages/GitHub Pages) — UI 미리보기

Firebase 결합부가 끊겨 **로그인·동의·AI는 미동작**(우아한 에러). UI/UX 리뷰용.
- **Render**: `render.yaml`(이 저장소) → Render Blueprint 연결.
- **Vercel/Netlify/Cloudflare Pages**: 빌드 `npm ci && npm run build`, 출력 `dist`,
  SPA fallback(`/* → /index.html`) 설정. GitHub 저장소 연결로 자동 배포.
- **GitHub Pages**: 저장소가 이미 GitHub에 있으므로 Actions로 `dist` 배포 가능
  (base 경로 주의: 사용자/조직 페이지가 아니면 `vite build --base=/medi-curator/`).
- 공통 한계: `/__/firebase/init.json`·`/api/*`가 없어 Firebase 레이어 비동작.

---

## 권장 결론
- **개발자 본인/내부 시험** → **A. 로컬 에뮬레이터** (가장 빠르고 안전, 공개 노출 0).
- **외부에 임시 링크 공유가 필요** → **B. Firebase 프리뷰 채널** (단, Firebase 프로젝트 셋업 선행).
- **UI 디자인만 빠르게 공유** → **C. 정적 호스트** (Render/Vercel/Netlify 중 택1).

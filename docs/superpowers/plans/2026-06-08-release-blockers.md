# Release Blockers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Check, 중앙 사용자 할당량, 정책 페이지, 미확정 사업자 정보 배포 차단 검사를 구현한다.

**Architecture:** Firebase 클라이언트 초기화 모듈이 App Check 토큰을 제공하고, Cloud Function은 App Check와 Auth/동의를 순서대로 검증한다. 사용자별 요청 제한은 Firestore transaction helper로 분리하며, 정책 콘텐츠와 release readiness 검사는 독립 모듈로 유지한다.

**Tech Stack:** React 19, TypeScript 6, Firebase Web/Admin SDK, Firestore, Vitest, Playwright, Node.js scripts

---

### Task 1: App Check client and server enforcement

**Files:**
- Modify: `src/firebase.ts`
- Modify: `src/services/geminiService.ts`
- Modify: `functions/src/index.ts`
- Modify: `.env.local.example`
- Test: `tests/unit/firebaseConfig.test.ts`
- Test: `tests/unit/geminiService.test.ts`
- Test: `tests/unit/functionsOptions.test.ts`

- [ ] Add failing source and request tests for App Check initialization, request header, and server verification order.
- [ ] Run targeted Vitest tests and confirm expected failures.
- [ ] Initialize App Check only when a site key exists and export a token helper.
- [ ] Add `X-Firebase-AppCheck` to curate requests and map App Check failures to a user-facing error.
- [ ] Verify App Check before Auth and consent in the Cloud Function.
- [ ] Run targeted tests and Functions build.

### Task 2: Firestore central rate limit

**Files:**
- Create: `functions/src/rateLimit.ts`
- Modify: `functions/src/index.ts`
- Test: `tests/unit/functionsRateLimit.test.ts`
- Modify: `firestore.rules`

- [ ] Add failing tests for hour buckets, count limits, and source integration.
- [ ] Run tests and confirm expected failures.
- [ ] Implement a transaction-based UID quota with no health payload storage.
- [ ] Replace the in-memory Map limiter in `curate`.
- [ ] Explicitly deny client access to `rateLimits`.
- [ ] Run targeted tests and Functions build.

### Task 3: Policy pages and navigation

**Files:**
- Create: `src/components/PolicyDocuments.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/PrivacySettings.tsx`
- Test: `tests/unit/policyDocuments.test.tsx`
- Modify: `src/i18n/translations.ts`

- [ ] Add a failing render test for privacy policy, terms, overseas transfer, and launch placeholders.
- [ ] Run the test and confirm failure.
- [ ] Implement a focused policy component with internal document switching.
- [ ] Add policy navigation from footer and privacy settings.
- [ ] Run the render test and frontend build.

### Task 4: Release readiness gate

**Files:**
- Create: `config/release-profile.json`
- Create: `scripts/check-release-readiness.mjs`
- Create: `tests/scripts/check-release-readiness.test.mjs`
- Modify: `package.json`
- Modify: `docs/RUNBOOK-firebase.md`

- [ ] Add failing Node tests for placeholder business data, missing App Check key, and valid configuration.
- [ ] Run the script tests and confirm failure.
- [ ] Implement the JSON profile validator and CLI.
- [ ] Add `gate:release-readiness` and `gate:release` scripts.
- [ ] Document exact production variables and expected failure behavior.
- [ ] Run script tests and confirm the current profile intentionally fails readiness.

### Task 5: Full verification and gate report

**Files:**
- Create: `docs/reviews/RELEASE-BLOCKERS-2026-06-08.md`

- [ ] Run lint, frontend build, Functions build, secret scans, unit coverage, and E2E.
- [ ] Run release readiness and record its intentional failure caused by business placeholders/site key.
- [ ] Document resolved code findings and external blockers.
- [ ] Run `git diff --check` and inspect final status.

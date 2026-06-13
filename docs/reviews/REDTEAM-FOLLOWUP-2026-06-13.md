# REDTEAM-FOLLOWUP-2026-06-13

## Decision

**HOLD 유지.** 코드 레벨에서 즉시 줄일 수 있는 의료·약사법 red-team 리스크 일부를 축소했지만, production 공개/광고/제휴/베타는 여전히 금지한다.

## 이번 패치 범위

REDTEAM-2026-06-07과 RELEASE-BLOCKERS-2026-06-08을 기준으로, 외부 승인이나 production secret 없이 코드로 즉시 처리 가능한 항목만 수정했다.

### 1. RT-002/RT-003/RT-005: 증상 결과의 약품 추천성 제거

변경 파일:
- `src/app/components/SymptomAnalysis.tsx`
- `src/app/components/i18n.tsx`
- `src/app/components/Menu.tsx`

조치:
- 고정 데모 결과에서 구체 OTC 약품명, 약물 후보, 민간요법, 운동처방성 카피를 제거했다.
- 결과 섹션을 다음 범위로 축소했다.
  - 상담 전 정리할 정보
  - 복용 정보 확인 안내
  - 일반 생활관리
  - 피해야 할 행동
  - 위험 신호
- 다국어 홈/헤더 카피에서 “OTC suggestions”, “일반의약품 후보” 같은 추천성 문구를 제거했다.

### 2. RT-003/RT-005: 증상 결과와 약국 탐색 결합 완화

변경 파일:
- `src/app/components/SymptomAnalysis.tsx`
- `src/app/page.tsx`
- `src/app/components/NextSteps.tsx`

조치:
- 증상 분석 결과 내부의 “이 증상으로 약국 찾기” CTA를 제거했다.
- 다음 단계에서 AI 추가 질문 UI를 제거했다.
- 다음 단계 카피를 “독립 약국 검색”, “전문가 상담 준비”, “복용 정보 정리”, “개인정보 설정” 중심으로 바꿨다.

### 3. RT-006/RT-011: 법적/개인정보 문구 정합성 개선

변경 파일:
- `src/app/components/Legal.tsx`

조치:
- 서비스 소개를 “AI 건강 가이드/약사 감수 기반 추천”에서 “건강 정보 도구/참고용”으로 낮췄다.
- 입력 정보가 항상 로컬에만 저장된다는 표현을 제거하고, 분석 요청 시 서버 처리 가능성을 명시했다.
- 복용 안전 검사는 모든 상호작용 판정이나 복용 가능 보장을 하지 않는다고 명시했다.
- 처방전/약봉투 OCR은 출시 전 의료 판단에 사용하지 않는다고 명시했다.

### 4. Gate 1 type safety: TypeScript build 차단 오류 수정

변경 파일:
- `src/app/components/HeroCanvas.tsx`

조치:
- Three.js `userData` 강제 캐스팅을 제거하고, 애니메이션 메타데이터를 별도 typed 배열로 관리하도록 변경했다.
- `npx tsc -b --pretty false` PASS 확인.

## Verification

| Check | Result |
|---|---|
| `npx tsc -b --pretty false` | PASS |
| `npm run build` | PASS |
| `npm run scan:secrets` | PASS |
| `npm run scan:bundle` | PASS |
| red-team string scan: removed old OTC/AI CTA examples | PASS for targeted strings |
| `npm run gate:release-readiness` | EXPECTED BLOCK |
| `npm run lint` | BLOCKED: local ESLint invocation timed out after 600s |
| `npx vitest run ...` | BLOCKED: Vitest worker startup timeout on Node v24.14.0 / iCloud path |

## Current Release Blocks

Production release is still blocked by:

1. 실제 사업자명, 대표자, 사업장 주소, 개인정보 보호책임자, 개인정보 문의 이메일 미확정.
2. production `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` 미설정.
3. Firebase Console Web App Check provider 등록 및 enforcement 증거 없음.
4. `rateLimits.expiresAt` Firestore TTL 정책 배포 증거 없음.
5. 한국 의료·약사 전문 변호사 서면 의견 없음.
6. 의사·약사 임상 검토 승인 없음.
7. MFDS 규제 분류 사전 질의 및 50건/100건 의료 회귀셋 승인 근거 없음.
8. 전체 lint/test 게이트가 현 로컬 환경에서 완료되지 않음.

## Next Recommended Order

1. 로컬 Node를 프로젝트 호환 LTS로 고정하거나 iCloud 밖 작업트리에서 Vitest/ESLint hang을 재검증한다.
2. InteractionCheck/VitaminPairing 쪽의 구체 성분·상호작용 카피도 “전문가 확인 항목 정리” 수준으로 축소할지 결정한다.
3. production release profile과 App Check site key를 입력한 뒤 `npm run gate:release-readiness`를 재실행한다.
4. Firebase App Check enforcement와 Firestore TTL 배포 증거를 캡처해 release evidence에 첨부한다.
5. 외부 법무/임상 서면 승인 전까지 production deploy는 계속 HOLD한다.

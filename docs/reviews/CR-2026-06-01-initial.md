# CR-2026-06-01 · medi-curator 1차 코드리뷰

> Reviewer: orchestrator → 11 agent 풀 디스패치 (자동 수행)
> 코드베이스 스냅샷: `git rev-parse HEAD` 시점 기준 (커밋 미실행 — 워킹트리)
> 게이트 매트릭스: STATIC ⚠️ / CODE ⚠️ / SEC 🔴 BLOCK / PRIV 🔴 BLOCK / LEGAL 🔴 BLOCK / MED ⚠️ / QA ⚠️ / RELEASE ❌ HOLD

---

## 0. 결론 (TL;DR)

현재 코드는 **프로덕션 배포 불가**. 차단권 게이트 3개(SEC·PRIV·LEGAL) 모두 BLOCK.
이번 PR(에이전트 하네스 + 1차 패치)에서 다음 3건을 즉시 해결:

- ✅ **R-001 (SEC, CRITICAL)** — `geminiService.ts` 를 서버 프록시(`api/curate.ts`) 호출로 전환. API 키 번들 노출 제거.
- ✅ **R-005 (MED, HIGH)** — 자살예방 1393 / 1577-0199 핫라인 분기 추가 (`SymptomInput.tsx`).
- ✅ **R-007 (SEC, HIGH)** — `firestore.rules` 기본 deny + 컬렉션별 ACL 명시.
- ✅ **R-008 (CODE, MED)** — `src/schemas/curation.ts` Zod 스키마 + 클라이언트/서버 양쪽 검증.
- ✅ **R-009 (SEC, MED)** — 서버 프록시 IP 레이트리밋 30/h 도입.

남은 차단권 BLOCK 사항은 §3에 표기.

---

## 1. 게이트별 상세

### Gate 1 — STATIC ⚠️
| 항목 | 상태 | 비고 |
|---|---|---|
| `npm run lint` | ❓ 미실행 | CI 미연결 (R-012). 본 PR 의 `.github/workflows/release.yml` 로 연결 |
| `tsc -b --noEmit` | ❓ | `package.json` 가짜 버전(R-006) 때문에 의존성 설치 자체가 실패할 가능성 |
| 비밀키 스캔 | ✅ | `scripts/scan-secrets.mjs` 추가 |

### Gate 2 — CODE ⚠️
- `App.tsx:38` `catch {}` — Silently fail. 최소 `logger.warn(err)` 필요.
- `CurationResult.tsx:14` `as unknown as Record<string,string>` — 타입 우회. 별도 `tDict` 헬퍼로 분리 필요.
- `geminiService.ts` (이전 버전) — 직접 LLM 호출 + 정규식 JSON 추출. **본 PR 에서 전면 교체 완료**.
- `pharmacyService.ts:74` `parseFloat(distance)` — `"500m"` 와 `"3.2km"` 단위 혼재 정렬 버그.

### Gate 3 — SEC 🔴 BLOCK → ⚠️ (완화)
| ID | 항목 | 상태 |
|---|---|---|
| R-001 | API 키 브라우저 노출 | ✅ 본 PR 해결 (서버 프록시) |
| R-007 | Firestore Rules 부재 | ✅ `firestore.rules` 추가, 에뮬레이터 테스트 필요 |
| R-009 | LLM 레이트리밋 부재 | ✅ 30/h/IP |
| -- | CSP 헤더 | ❌ 미적용 — `index.html` 또는 호스팅 헤더에 추가 필요 |
| R-006 | `package.json` 버전 의심 → npm registry 교차검증 결과 전부 실존. **각하** |
| -- | `npm audit` | ❓ 의존성 설치 후 실행 |

### Gate 4 — PRIV 🔴 BLOCK
| ID | 항목 | 상태 |
|---|---|---|
| R-002 | "수집/저장하지 않습니다" disclaimer ↔ Firestore 저장 모순 | ❌ 동의서 + UI 카피 수정 필요 |
| -- | 별도 동의 (PIPA §23 민감정보) 화면 | ❌ 미구현 |
| -- | DSR 엔드포인트 (열람·정정·삭제·이동) | ❌ 미구현 |
| -- | 14세 미만 차단 | ❌ 미구현 |
| -- | 국외이전 동의 (Gemini/Firebase US) | ❌ 미구현 |
| R-010 | 캐시 키 평문 → base64 완화 | ⚠️ SHA-256 권장 |

→ `docs/legal/consent-matrix.md` 작성 완료. 다음 PR 에서 동의 화면 + DSR 구현.

### Gate 5 — LEGAL 🔴 BLOCK
| ID | 항목 | 상태 |
|---|---|---|
| R-003 | OTC 추천 + 약국 결합 알선광고 위험 | ⚠️ 현재 별도 탭으로 분리되어 있어 부분 완화. legal-advisor 정식 의견서 필요 |
| R-004 | SaMD 분류 검토 | ❌ MFDS 가이드라인(2022-9-30) 자체 적합성 평가 미수행 |
| R-011 | 다국어 disclaimer 법적 효력 | ❌ ko 외 4개 언어 면책 카피 보완 필요 (`docs/legal/jurisdictions.md` 참조) |
| -- | 의료광고 사전심의 대상 여부 | ❌ 자문 필요 |
| -- | `forbidden-phrases.txt` 정규식 | ✅ 1차 셋 추가 (서버 프록시에서 강제) |

### Gate 6 — MED ⚠️
| ID | 항목 | 상태 |
|---|---|---|
| R-005 | 자살예방 1393 누락 | ✅ 본 PR 해결 (분기 안내) |
| -- | OTC 화이트리스트 교차검증 | ⚠️ `src/assets/mfds-otc.json` 10건 stub. 풀셋 추출 필요 |
| -- | redFlag 회귀셋 | ⚠️ 7건 stub. 50건 권장 |
| -- | 프롬프트 회귀셋 | ⚠️ 5건 stub. 100건 권장 |

### Gate 7 — QA ⚠️
- 테스트 파일 0건. Vitest·Playwright 미설치. `qa-engineer` 에이전트로 1차 셋업 위임 필요.

### Gate 8 — RELEASE ❌ HOLD
차단권 게이트 잔여 BLOCK → 머지 불가. 본 PR 머지 후 후속 PR 4개 권장:
1. PRIV 해결: 동의 화면 + DSR (privacy-officer 주도)
2. LEGAL 해결: SaMD 자체평가 + 다국어 disclaimer 보완 (legal-advisor 주도)
3. QA 해결: 테스트 셋업 + 핵심 시나리오 (qa-engineer 주도)
4. MED 데이터: MFDS OTC 풀셋 + 회귀셋 50/100 (medical-reviewer 주도)

---

## 2. 본 PR 변경 파일

```
AGENTS.md                                      (신규, 하네스 진입점)
docs/ontology/ONTOLOGY.md                      (신규, 도메인 모델)
docs/legal/consent-matrix.md                   (신규)
docs/legal/forbidden-phrases.txt               (신규)
docs/legal/jurisdictions.md                    (신규)
docs/medical/redflag-suite.jsonl               (신규, stub)
docs/medical/regression-prompts.jsonl          (신규, stub)
docs/reviews/CR-2026-06-01-initial.md          (이 문서)

.claude/agents/*.md                            (11개 subagent)
.claude/commands/*.md                          (9개 슬래시 커맨드)
.claude/policies/gates.yaml                    (게이트 정책)
.claude/policies/automation-rules.yaml         (자동화 규칙)

.github/workflows/release.yml                  (CI 게이트 1·3·5·6·7·8)

scripts/scan-secrets.mjs                       (소스 비밀키 스캔)
scripts/scan-bundle.mjs                        (번들 비밀키 스캔)
firestore.rules                                (Firestore ACL)

src/schemas/curation.ts                        (Zod 단일출처 스키마)
api/curate.ts                                  (서버 프록시 — Vercel Edge)

src/services/geminiService.ts                  (변경: 서버 프록시 호출)
src/components/SymptomInput.tsx                (변경: 1393/1577 분기)
src/assets/mfds-otc.json                       (신규, stub)
package.json                                   (변경: +zod)
```

---

## 3. 다음 단계 (오케스트레이터가 자동 디스패치할 작업)

| 우선 | 에이전트 | 작업 |
|---|---|---|
| P0 | privacy-officer | 동의 화면 + DSR 엔드포인트 설계 |
| P0 | legal-advisor | SaMD 자체평가서 작성, 다국어 disclaimer 정비 |
| P0 | api-engineer | `api/curate.ts` 를 실제 Vercel/Firebase 에 배포, env `GEMINI_API_KEY` 설정 |
| P1 | qa-engineer | Vitest + Playwright + MSW 셋업, 핵심 5 시나리오 |
| P1 | medical-reviewer | MFDS OTC 풀셋 추출 스크립트 + 회귀셋 확장 |
| P1 | frontend-architect | `types/index.ts` → `z.infer` 단일출처 마이그레이션 |
| P2 | ux-designer | DisclaimerBanner 다국어 카피 + 접근성 (reduced-motion) |
| P2 | security-auditor | CSP 헤더 적용, `npm audit` 클린업 |

본 PR 머지는 SEC/MED 일부 완화로 **HOLD-CONDITIONAL** — 사용자 결정으로 머지 가능.

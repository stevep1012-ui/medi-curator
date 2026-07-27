---
description: 코드 변경이 ONTOLOGY.md 와 동기화돼 있는지 검사.
---

먼저 `npx vitest run tests/unit/ontologySync.test.ts` 를 실행한다. 기계적으로
검사 가능한 부분(불변식 강제 지점, 응급 번호, Surface 실재 여부)은 이 테스트가 잡는다.
그 다음 아래를 사람이 판단한다:

1. `src/types.ts` 의 인터페이스 ↔ `docs/ontology/ONTOLOGY.md §2.2` 클래스 1:1.
2. 새 Firestore 컬렉션 ↔ `docs/legal/consent-matrix.md` 행 존재.
3. `src/services/` 의 함수 ↔ ONTOLOGY §2.3 Process 표 존재.
4. ONTOLOGY §2.5 Surface 에 적힌 컴포넌트가 `src/app/components/` 에 실재하는지.
5. §3 불변식마다 **강제 지점(파일:라인)** 이 명시돼 있는지. 강제되지 않는 규칙을
   강제되는 것처럼 적어 두면 잘못된 안심을 주므로, 미구현이면 그렇게 표기돼야 한다.
6. 불일치 발견 시 `frontend-architect` + `privacy-officer` 알림.

> 경로 주의: 타입은 `src/types/index.ts` 가 아니라 `src/types.ts`, 서비스는
> `services/` 가 아니라 `src/services/` 다. 이전 커맨드는 존재하지 않는 경로를
> 가리켜 실행해도 아무것도 검사하지 못했다.

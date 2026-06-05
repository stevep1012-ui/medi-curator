---
description: 코드 변경이 ONTOLOGY.md 와 동기화돼 있는지 검사.
---

다음을 검사:
1. `src/types/index.ts` 의 인터페이스 ↔ `docs/ontology/ONTOLOGY.md §2.2` 클래스 1:1.
2. 새 Firestore 컬렉션 ↔ `docs/legal/consent-matrix.md` 행 존재.
3. `services/` 의 함수 ↔ ONTOLOGY §2.3 Process 표 존재.
4. 불일치 발견 시 `frontend-architect` + `privacy-officer` 알림.

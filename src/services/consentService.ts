// 동의·DSR 서비스 — Firestore CRUD + 서버 호출 래퍼.
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, Timestamp, writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  CONSENT_VERSION, ConsentRecord, type ConsentItems, type ConsentRecord as ConsentRecordType,
  type DSRType,
} from '../schemas/consent';

function requireDb() {
  if (!db) throw new Error('Firebase not configured');
  return db;
}

/** 현재 사용자의 최신 동의 기록 조회. 없으면 null. */
export async function getActiveConsent(uid: string): Promise<ConsentRecordType | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid, 'consents', CONSENT_VERSION));
  if (!snap.exists()) return null;
  const data = snap.data();
  const parsed = ConsentRecord.safeParse({
    version: data.version,
    acceptedAt: (data.acceptedAt as Timestamp)?.toDate?.()?.toISOString?.() ?? data.acceptedAt,
    items: data.items,
    isAdult: data.isAdult,
    userAgent: data.userAgent,
  });
  return parsed.success ? parsed.data : null;
}

/** 동의 저장. Firestore Rules 가 version·필수항목 검증. */
export async function saveConsent(
  uid: string,
  items: ConsentItems,
  isAdult: boolean,
): Promise<void> {
  await setDoc(
    doc(requireDb(), 'users', uid, 'consents', CONSENT_VERSION),
    {
      version: CONSENT_VERSION,
      acceptedAt: Timestamp.now(),
      items,
      isAdult,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : '',
    },
  );
}

/** 동의 철회 — 해당 버전 문서 삭제. 로컬 검색 이력 삭제는 UI 레이어에서 함께 처리. */
export async function revokeConsent(uid: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'users', uid, 'consents', CONSENT_VERSION));
}

// === DSR — 서버(Cloud Function) 호출. 본인확인은 ID 토큰 ===

async function callDSR(type: DSRType, patch?: Record<string, unknown>): Promise<unknown> {
  if (!auth?.currentUser) throw new Error('로그인이 필요합니다');
  const idToken = await auth.currentUser.getIdToken();
  const resp = await fetch('/api/dsr', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ type, patch }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await resp.json();
  if (!resp.ok || !body?.ok) throw new Error(body?.message ?? `DSR ${type} 실패 (${resp.status})`);
  return body;
}

/**
 * 열람권 (PIPA §35) — 클라이언트가 직접 자기 컬렉션을 읽을 수 있지만,
 * 감사로그(auditLogs)는 서버 SDK로만 접근 가능하므로 서버 경유가 정석.
 */
export async function dsrAccess(): Promise<unknown> {
  return callDSR('access');
}

/** 정정권 (PIPA §36) — 동의 항목·프로필 일부 수정 */
export async function dsrRectify(patch: Record<string, unknown>): Promise<unknown> {
  return callDSR('rectify', patch);
}

/** 삭제권 (PIPA §36) — 모든 사용자 데이터 즉시 폐기 (탈퇴 포함) */
export async function dsrErase(): Promise<unknown> {
  return callDSR('erase');
}

/** 이동권 (PIPA §35-2) — JSON 패키지 다운로드 URL/인라인 */
export async function dsrExport(): Promise<unknown> {
  return callDSR('export');
}

/**
 * 클라이언트 폴백: 서버 미배포 환경에서 최소한의 서버 데이터 삭제 동작 보장.
 * 서버 DSR 사용을 권장하지만, 운영자가 functions 배포 전에도 사용자 탈퇴 자체는 가능해야 함.
 * 검색 이력은 로컬 저장소에만 있으므로 UI 레이어에서 별도 삭제한다.
 */
export async function clientSideEraseFallback(uid: string): Promise<number> {
  const dbi = requireDb();
  let affected = 0;
  for (const coll of ['consents']) {
    const snap = await getDocs(collection(dbi, 'users', uid, coll));
    if (snap.empty) continue;
    const batch = writeBatch(dbi);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    affected += snap.size;
  }
  return affected;
}

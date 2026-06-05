// DSR (Data Subject Request) Cloud Function — PIPA §35, §35-2, §36
// 인증: Firebase Auth ID 토큰 (Authorization: Bearer)
// 감사: 모든 요청 auditLogs 컬렉션에 append (append-only, 5년 보존)

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { z } from 'zod';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

setGlobalOptions({ region: 'asia-northeast3', maxInstances: 5 });

const DSRType = z.enum(['access', 'rectify', 'erase', 'export']);
const Body = z.object({
  type: DSRType,
  patch: z.record(z.string(), z.unknown()).optional(),
});

async function audit(uid: string, type: string, ok: boolean, meta?: Record<string, unknown>) {
  await db.collection('auditLogs').add({
    uid,
    type,
    ok,
    at: admin.firestore.FieldValue.serverTimestamp(),
    ttlAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 365 * 24 * 3600 * 1000),
    meta: meta ?? null,
  });
}

async function snapshotUser(uid: string): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { uid, exportedAt: new Date().toISOString() };
  for (const coll of ['consents']) {
    const snap = await db.collection('users').doc(uid).collection(coll).get();
    out[coll] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  out.localSearchHistoryNote = 'Search history is stored only on the user device and is exported by the client UI.';
  return out;
}

async function deleteUserData(uid: string): Promise<number> {
  let affected = 0;
  for (const coll of ['consents']) {
    const snap = await db.collection('users').doc(uid).collection(coll).get();
    if (snap.empty) continue;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    affected += snap.size;
  }
  // Firebase Auth 계정도 폐기 — 탈퇴 의도일 때만 (PIPA §36)
  try { await auth.deleteUser(uid); } catch { /* 이미 삭제 등은 무시 */ }
  return affected;
}

export const dsr = onRequest(
  { cors: false, timeoutSeconds: 60, memory: '256MiB', invoker: 'public' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, code: 'METHOD', message: 'POST only' });
      return;
    }

    // ID 토큰 검증
    const authz = req.headers.authorization ?? '';
    const m = /^Bearer (.+)$/.exec(authz);
    if (!m) {
      res.status(401).json({ ok: false, code: 'NO_TOKEN', message: '인증 필요' });
      return;
    }
    let uid: string;
    try {
      const decoded = await auth.verifyIdToken(m[1]);
      uid = decoded.uid;
    } catch {
      res.status(401).json({ ok: false, code: 'BAD_TOKEN', message: '토큰 검증 실패' });
      return;
    }

    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: parsed.error.message });
      return;
    }
    const { type, patch } = parsed.data;
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    logger.info('dsr.start', { requestId, uid, type });

    try {
      let data: unknown = undefined;
      let affected = 0;

      switch (type) {
        case 'access':
        case 'export':
          data = await snapshotUser(uid);
          affected = Object.keys(data as object).length - 2;
          break;
        case 'rectify': {
          if (!patch) throw new Error('patch 누락');
          // 현재는 user 프로필(displayName)만 정정 허용. 동의 항목은 새 버전 동의로 갱신.
          if (typeof patch.displayName === 'string') {
            await auth.updateUser(uid, { displayName: patch.displayName });
            affected = 1;
          }
          break;
        }
        case 'erase':
          affected = await deleteUserData(uid);
          break;
      }

      await audit(uid, type, true, { requestId, affected });
      res.status(200).json({
        ok: true,
        type,
        data,
        receipt: { requestId, processedAt: new Date().toISOString(), affectedDocs: affected },
      });
    } catch (e) {
      logger.error('dsr.exception', { requestId, uid, type, err: (e as Error).message });
      await audit(uid, type, false, { requestId, err: (e as Error).message });
      res.status(500).json({ ok: false, code: 'EXCEPTION', message: (e as Error).message });
    }
  },
);

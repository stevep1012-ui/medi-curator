import * as admin from 'firebase-admin';
import { ADMIN_SUPERUSER_EMAILS } from './usageLimits';

type HeaderBag = { headers: Record<string, unknown> };

export type AdminCaller = { uid: string; email: string | null };

export async function requireAdmin(req: HeaderBag): Promise<
  | { ok: true; caller: AdminCaller }
  | { ok: false; status: number; code: string; message: string }
> {
  const authz = String(req.headers.authorization ?? '');
  const match = /^Bearer (.+)$/.exec(authz);
  if (!match) return { ok: false, status: 401, code: 'NO_TOKEN', message: '관리자 로그인이 필요합니다' };

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    const email = typeof decoded.email === 'string' ? decoded.email.toLowerCase() : null;
    const customClaimAdmin = decoded.admin === true || decoded.superuser === true;
    const allowlistAdmin = Boolean(email && ADMIN_SUPERUSER_EMAILS.includes(email));
    if (!customClaimAdmin && !allowlistAdmin) {
      return { ok: false, status: 403, code: 'ADMIN_REQUIRED', message: '슈퍼유저 권한이 필요합니다' };
    }
    return { ok: true, caller: { uid: decoded.uid, email } };
  } catch {
    return { ok: false, status: 401, code: 'BAD_TOKEN', message: '관리자 인증 확인에 실패했습니다' };
  }
}

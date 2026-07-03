import { getIdToken } from '../firebase';

export interface AdminUsageLimits {
  hourlyAiRequests: number;
  monthlyAiRequests: number;
}

interface AdminUsageEnvelope {
  ok?: boolean;
  data?: { limits?: AdminUsageLimits };
  code?: string;
  message?: string;
}

async function adminHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function unwrapUsageResponse(body: AdminUsageEnvelope, status: number): AdminUsageLimits {
  if (!body?.ok || !body.data?.limits) {
    throw new Error(body?.message || `관리자 설정 요청에 실패했습니다 (${status}).`);
  }
  return body.data.limits;
}

export async function fetchAdminUsageSettings(): Promise<AdminUsageLimits> {
  const res = await fetch('/api/admin/usage-settings', {
    method: 'GET',
    headers: await adminHeaders(),
  });
  const body = (await res.json().catch(() => null)) as AdminUsageEnvelope | null;
  return unwrapUsageResponse(body ?? {}, res.status);
}

export async function saveAdminUsageSettings(limits: AdminUsageLimits): Promise<AdminUsageLimits> {
  const res = await fetch('/api/admin/usage-settings', {
    method: 'PATCH',
    headers: await adminHeaders(),
    body: JSON.stringify(limits),
  });
  const body = (await res.json().catch(() => null)) as AdminUsageEnvelope | null;
  return unwrapUsageResponse(body ?? {}, res.status);
}

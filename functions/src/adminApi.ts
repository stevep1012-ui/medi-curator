import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { requireAdmin } from './adminAccess';
import { getEffectiveUsageLimits, saveUsageLimits, UsageLimitsSchema } from './usageSettings';

if (!admin.apps.length) admin.initializeApp();

const PatchUsageSettings = z.object({
  hourlyAiRequests: z.number().int().min(1).max(10_000),
  monthlyAiRequests: z.number().int().min(1).max(1_000_000),
});

export const adminUsageSettings = onRequest(
  { cors: false, timeoutSeconds: 15, memory: '256MiB', invoker: 'public', region: 'asia-northeast3' },
  async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'PATCH') {
      res.status(405).json({ ok: false, code: 'METHOD', message: 'GET or PATCH only' });
      return;
    }

    const caller = await requireAdmin(req);
    if (!caller.ok) {
      res.status(caller.status).json({ ok: false, code: caller.code, message: caller.message });
      return;
    }

    const db = admin.firestore();
    if (req.method === 'GET') {
      const limits = await getEffectiveUsageLimits(db);
      res.status(200).json({ ok: true, data: { limits, caller: caller.caller } });
      return;
    }

    const parsed = PatchUsageSettings.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: parsed.error.message });
      return;
    }

    const saved = await saveUsageLimits(db, UsageLimitsSchema.parse(parsed.data), caller.caller.uid);
    res.status(200).json({ ok: true, data: { limits: saved, caller: caller.caller } });
  },
);

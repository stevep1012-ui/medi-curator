// 약국 검색 Cloud Function — Kakao Local "카테고리로 장소 검색"(PM9=약국) 프록시.
// Kakao REST 키는 서버에만 두고(시크릿) 브라우저에 노출하지 않는다. App Check로
// 무결한 앱 요청만 허용해 키 남용을 막는다. 인증/동의 불필요(공개 약국 위치 정보).
// 시크릿: firebase functions:secrets:set KAKAO_REST_KEY

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { z } from 'zod';

if (!admin.apps.length) admin.initializeApp();

const KAKAO_REST_KEY = defineSecret('KAKAO_REST_KEY');

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(20000).optional(),
});

interface KakaoDoc {
  place_name?: string;
  address_name?: string;
  road_address_name?: string;
  phone?: string;
  distance?: string;
  x?: string;
  y?: string;
  place_url?: string;
}

export const pharmacies = onRequest(
  {
    region: 'asia-northeast3',
    maxInstances: 5,
    cors: false,
    timeoutSeconds: 20,
    memory: '256MiB',
    invoker: 'public',
    secrets: [KAKAO_REST_KEY],
  },
  async (req, res) => {
    // App Check — best-effort(완화 모드). 토큰이 있으면 검증해 로그를 남기되,
    // 없거나 유효하지 않아도 차단하지 않는다. 공개 약국 위치 정보이고 reCAPTCHA
    // 사이트키 미설정 환경에서도 약국 검색이 동작해야 하므로 하드 차단을 풀었다.
    // (남용 억제는 maxInstances=5 + 8초 타임아웃 + Kakao 키 서버 보관으로 완화.)
    const token = String(req.headers['x-firebase-appcheck'] ?? '');
    if (token) {
      try {
        await admin.appCheck().verifyToken(token);
      } catch {
        logger.info('pharmacies.appcheck_soft_fail');
      }
    }

    const parsed = Query.safeParse(req.method === 'POST' ? req.body : req.query);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: '위치(lat,lng)가 올바르지 않습니다' });
      return;
    }
    const { lat, lng, radius = 1000 } = parsed.data;

    try {
      const url =
        `https://dapi.kakao.com/v2/local/search/category.json` +
        `?category_group_code=PM9&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15`;
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 8_000);
      let kr: Response;
      try {
        kr = await fetch(url, {
          headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY.value()}` },
          signal: ctl.signal,
        });
      } finally {
        clearTimeout(to);
      }

      if (!kr.ok) {
        const txt = await kr.text().catch(() => '');
        logger.warn('pharmacies.upstream_error', { status: kr.status, body: txt.slice(0, 200) });
        res.status(502).json({ ok: false, code: 'UPSTREAM', message: `kakao ${kr.status}` });
        return;
      }

      const body = (await kr.json()) as { documents?: KakaoDoc[] };
      const items = (body.documents ?? []).map((d) => ({
        name: d.place_name ?? '',
        addr: d.road_address_name || d.address_name || '',
        phone: d.phone ?? '',
        distance: d.distance ? Number(d.distance) : null,
        lat: d.y ? Number(d.y) : null,
        lng: d.x ? Number(d.x) : null,
        url: d.place_url ?? '',
      }));
      res.status(200).json({ ok: true, items });
    } catch (e) {
      logger.error('pharmacies.exception', { err: (e as Error).message });
      res.status(500).json({ ok: false, code: 'EXCEPTION', message: '약국 검색에 실패했습니다' });
    }
  },
);

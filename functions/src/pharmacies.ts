// 약국 검색 Cloud Function — Google Places "Nearby Search (New)" 프록시.
// 약국 위치·연락처에 더해 별점(rating)·영업시간(opening hours)·영업중 여부를
// 한 번의 호출로 가져온다. 거리(m)는 요청 좌표와 결과 좌표로 직접 계산한다.
// API 키는 서버 시크릿에만 두고 브라우저에 노출하지 않으며, App Check로
// 무결한 앱 요청만 허용해 키 남용을 막는다. 인증/동의 불필요(공개 약국 정보).
// 시크릿: firebase functions:secrets:set GOOGLE_PLACES_KEY

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { z } from 'zod';

if (!admin.apps.length) admin.initializeApp();

const GOOGLE_PLACES_KEY = defineSecret('GOOGLE_PLACES_KEY');

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(20000).optional(),
});

interface PlacesPlace {
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
}

// 두 좌표 사이 거리(m). Haversine.
function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(s))));
}

export const pharmacies = onRequest(
  {
    region: 'asia-northeast3',
    maxInstances: 5,
    cors: false,
    timeoutSeconds: 20,
    memory: '256MiB',
    invoker: 'public',
    secrets: [GOOGLE_PLACES_KEY],
  },
  async (req, res) => {
    // App Check — 무결한 앱에서 온 요청만 허용(키 남용 방지).
    const token = String(req.headers['x-firebase-appcheck'] ?? '');
    if (!token) {
      res.status(401).json({ ok: false, code: 'APP_CHECK_REQUIRED', message: '앱 무결성 확인이 필요합니다' });
      return;
    }
    try {
      await admin.appCheck().verifyToken(token);
    } catch {
      res.status(401).json({ ok: false, code: 'APP_CHECK_REQUIRED', message: '앱 무결성 확인에 실패했습니다' });
      return;
    }

    const parsed = Query.safeParse(req.method === 'POST' ? req.body : req.query);
    if (!parsed.success) {
      res.status(400).json({ ok: false, code: 'BAD_INPUT', message: '위치(lat,lng)가 올바르지 않습니다' });
      return;
    }
    const { lat, lng, radius = 1000 } = parsed.data;

    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 8_000);
      let gr: Response;
      try {
        gr = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_KEY.value(),
            'X-Goog-FieldMask': [
              'places.displayName',
              'places.formattedAddress',
              'places.shortFormattedAddress',
              'places.location',
              'places.nationalPhoneNumber',
              'places.rating',
              'places.userRatingCount',
              'places.googleMapsUri',
              'places.regularOpeningHours.weekdayDescriptions',
              'places.currentOpeningHours.openNow',
            ].join(','),
          },
          body: JSON.stringify({
            includedTypes: ['pharmacy'],
            maxResultCount: 15,
            rankPreference: 'DISTANCE',
            languageCode: 'ko',
            regionCode: 'KR',
            locationRestriction: {
              circle: { center: { latitude: lat, longitude: lng }, radius },
            },
          }),
          signal: ctl.signal,
        });
      } finally {
        clearTimeout(to);
      }

      if (!gr.ok) {
        const txt = await gr.text().catch(() => '');
        logger.warn('pharmacies.upstream_error', { status: gr.status, body: txt.slice(0, 200) });
        res.status(502).json({ ok: false, code: 'UPSTREAM', message: `places ${gr.status}` });
        return;
      }

      const body = (await gr.json()) as { places?: PlacesPlace[] };
      const items = (body.places ?? []).map((p) => {
        const plat = p.location?.latitude ?? null;
        const plng = p.location?.longitude ?? null;
        return {
          name: p.displayName?.text ?? '',
          addr: p.shortFormattedAddress || p.formattedAddress || '',
          phone: p.nationalPhoneNumber ?? '',
          distance: plat != null && plng != null ? distanceMeters(lat, lng, plat, plng) : null,
          lat: plat,
          lng: plng,
          url: p.googleMapsUri ?? '',
          rating: typeof p.rating === 'number' ? p.rating : null,
          ratingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
          openNow: typeof p.currentOpeningHours?.openNow === 'boolean' ? p.currentOpeningHours.openNow : null,
          hours: p.regularOpeningHours?.weekdayDescriptions ?? null,
        };
      });
      // Places가 거리순을 보장하지 않을 때를 대비해 거리로 정렬.
      items.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      res.status(200).json({ ok: true, items });
    } catch (e) {
      logger.error('pharmacies.exception', { err: (e as Error).message });
      res.status(500).json({ ok: false, code: 'EXCEPTION', message: '약국 검색에 실패했습니다' });
    }
  },
);

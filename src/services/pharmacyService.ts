// 약국 검색 클라이언트 — 서버 프록시(/api/pharmacies, Google Places Nearby)를 호출한다.
// Places API 키는 서버에만 있고, 여기서는 App Check 토큰만 best-effort로 붙인다.
import { getAppCheckToken } from '../firebase';

export interface Pharmacy {
  name: string;
  addr: string;
  phone: string;
  distance: number | null; // meters
  lat: number | null;
  lng: number | null;
  url: string; // Google Maps place page
  rating?: number | null; // 0–5
  ratingCount?: number | null; // number of user ratings
  openNow?: boolean | null; // 현재 영업 중 여부
  hours?: string[] | null; // 요일별 영업시간 (Google weekdayDescriptions)
}

interface Envelope {
  ok?: boolean;
  code?: string;
  items?: Pharmacy[];
}

export async function searchPharmacies(lat: number, lng: number, radius = 1000): Promise<Pharmacy[]> {
  const headers: Record<string, string> = {};
  const appCheck = await getAppCheckToken();
  if (appCheck) headers['X-Firebase-AppCheck'] = appCheck;

  let res: Response;
  try {
    res = await fetch(`/api/pharmacies?lat=${lat}&lng=${lng}&radius=${radius}`, { headers });
  } catch {
    throw new Error('NETWORK');
  }

  let body: Envelope | null = null;
  try {
    body = (await res.json()) as Envelope;
  } catch {
    body = null;
  }
  if (!res.ok || !body?.ok) {
    throw new Error(body?.code || `HTTP_${res.status}`);
  }
  return body.items ?? [];
}

// 거리(m)를 사람이 읽는 표기로. null은 빈 문자열.
export function formatDistance(m: number | null): string {
  if (m == null) return '';
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

// 길찾기 딥링크 — Kakao place 페이지가 있으면 그걸, 없으면 좌표 기반 길찾기.
export function directionsUrl(p: Pharmacy): string {
  if (p.url) return p.url;
  if (p.lat != null && p.lng != null) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
  }
  return `https://map.kakao.com/?q=${encodeURIComponent(p.name)}`;
}

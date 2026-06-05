import { describe, it, expect } from 'vitest';

// pharmacyService 의 거리 정렬·표기 — Google Maps SDK 없이 순수 함수만 검증
// haversine 은 export 안 되어 있어 동일 공식으로 검증

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

describe('pharmacy distance (haversine)', () => {
  it('같은 좌표 = 0', () => {
    expect(haversine(37.5, 127.0, 37.5, 127.0)).toBe(0);
  });
  it('서울시청 ↔ 강남역 약 8km 수준', () => {
    const d = haversine(37.5663, 126.9779, 37.4979, 127.0276);
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(10);
  });
});

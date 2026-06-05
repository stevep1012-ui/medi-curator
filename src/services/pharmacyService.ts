import type { Pharmacy } from '../types';

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function searchNearbyPharmacies(
  lat: number,
  lng: number,
  map: google.maps.Map,
): Promise<Pharmacy[]> {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(map);
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(lat, lng),
      radius: 3000,
      type: 'pharmacy',
      language: 'ko',
    };

    service.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places API error: ${status}`));
        }
        return;
      }

      const pharmacies: Pharmacy[] = results.map((place) => {
        const placeLat = place.geometry?.location?.lat() ?? 0;
        const placeLng = place.geometry?.location?.lng() ?? 0;
        const dist = haversineDistance(lat, lng, placeLat, placeLng);

        return {
          placeId: place.place_id ?? '',
          name: place.name ?? '',
          address: place.vicinity ?? '',
          distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`,
          isOpen: place.opening_hours?.isOpen() ?? false,
          rating: place.rating,
          location: { lat: placeLat, lng: placeLng },
        };
      });

      pharmacies.sort((a, b) => {
        const da = parseFloat(a.distance);
        const db = parseFloat(b.distance);
        return da - db;
      });

      resolve(pharmacies);
    });
  });
}

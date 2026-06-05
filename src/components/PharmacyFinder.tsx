import { useState, useRef, useCallback, useEffect } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { MapPin, Navigation, Loader2, Star, Phone as PhoneIcon, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import { getCurrentPosition, searchNearbyPharmacies } from '../services/pharmacyService';
import type { Pharmacy } from '../types';

function MapComponent({ center, pharmacies, onMapReady }: {
  center: { lat: number; lng: number };
  pharmacies: Pharmacy[];
  onMapReady: (map: google.maps.Map) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new google.maps.Map(ref.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    });
    mapRef.current = map;
    onMapReady(map);
  }, [center, onMapReady]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // User marker
    new google.maps.Marker({
      position: center,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });

    pharmacies.forEach((p) => {
      const marker = new google.maps.Marker({
        position: p.location,
        map: mapRef.current!,
        title: p.name,
        label: { text: '+', color: '#fff', fontWeight: 'bold' },
      });

      const info = new google.maps.InfoWindow({
        content: `<div style="font-size:13px;max-width:200px">
          <strong>${p.name}</strong><br/>
          <span style="color:#666">${p.address}</span><br/>
          <span style="color:${p.isOpen ? '#16a34a' : '#dc2626'}">${p.isOpen ? '영업 중' : '영업 종료'}</span>
          ${p.rating ? `<br/>⭐ ${p.rating}` : ''}
        </div>`,
      });

      marker.addListener('click', () => info.open(mapRef.current!, marker));
      markersRef.current.push(marker);
    });
  }, [center, pharmacies]);

  return <div ref={ref} className="w-full h-64 sm:h-80 rounded-xl" />;
}

export default function PharmacyFinder() {
  const { t } = useLanguage();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [addressMode, setAddressMode] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const searchFromLocation = async (lat: number, lng: number) => {
    setCenter({ lat, lng });
    setLoading(true);
    setError('');
    try {
      // Wait for map to be ready
      const waitForMap = () =>
        new Promise<google.maps.Map>((resolve) => {
          const check = () => {
            if (mapInstanceRef.current) resolve(mapInstanceRef.current);
            else setTimeout(check, 100);
          };
          check();
        });
      const map = await waitForMap();
      const results = await searchNearbyPharmacies(lat, lng, map);
      setPharmacies(results);
      if (results.length === 0) setError(t.noPharmacyFound);
    } catch {
      setError(t.apiError);
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = async () => {
    setLoading(true);
    setError('');
    try {
      const pos = await getCurrentPosition();
      await searchFromLocation(pos.coords.latitude, pos.coords.longitude);
    } catch {
      setError(t.locationPermissionDenied);
      setAddressMode(true);
      setLoading(false);
    }
  };

  const handleAddressSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const address = formData.get('address') as string;
    if (!address.trim()) return;

    setLoading(true);
    setError('');
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, async (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        await searchFromLocation(loc.lat(), loc.lng());
      } else {
        setError(t.apiError);
        setLoading(false);
      }
    });
  };

  if (!apiKey) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
        Google Maps API 키가 설정되지 않았습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleUseLocation}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold text-sm hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          {t.useMyLocation}
        </button>
        <button
          onClick={() => setAddressMode(!addressMode)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          {t.enterAddress}
        </button>
      </div>

      {addressMode && (
        <form onSubmit={handleAddressSearch} className="flex gap-2">
          <input
            name="address"
            type="text"
            placeholder="예: 서울시 강남구 역삼동"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.findNearbyPharmacy}
          </button>
        </form>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
      )}

      {/* Map */}
      {center && (
        <Wrapper apiKey={apiKey} libraries={['places']}>
          <MapComponent center={center} pharmacies={pharmacies} onMapReady={handleMapReady} />
        </Wrapper>
      )}

      {/* Pharmacy List */}
      {pharmacies.length > 0 && (
        <div className="space-y-2">
          {pharmacies.map((p) => (
            <div
              key={p.placeId}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{p.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.isOpen
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    }`}
                  >
                    {p.isOpen ? t.openNow : t.closed}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{p.address}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {p.distance}
                  </span>
                  {p.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" /> {p.rating}
                    </span>
                  )}
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex items-center gap-1 hover:text-teal-500">
                      <PhoneIcon className="w-3 h-3" /> {p.phone}
                    </a>
                  )}
                </div>
              </div>
              <Clock className={`w-4 h-4 shrink-0 mt-1 ${p.isOpen ? 'text-green-500' : 'text-red-400'}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

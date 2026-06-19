"use client";

import { useState } from "react";
import { AlertIcon, NavIcon, PinIcon } from "./icons";
import { useI18n } from "./i18n";
import {
  searchPharmacies,
  formatDistance,
  directionsUrl,
  type Pharmacy,
} from "../../services/pharmacyService";

export default function PharmacyFinder() {
  const { t } = useI18n();
  const p = t.pharmacy;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Pharmacy[] | null>(null);

  function locate() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError(p.locationDenied);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const list = await searchPharmacies(pos.coords.latitude, pos.coords.longitude);
          setItems(list);
        } catch {
          // 서비스가 에러 코드를 던진다(NETWORK/APP_CHECK_REQUIRED/UPSTREAM 등) — 사용자에겐 일반 메시지.
          setError(p.searchError);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError(p.locationDenied);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={locate}
          disabled={loading}
          aria-busy={loading}
          className="inline-flex h-[50px] flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl bg-brand text-sm font-bold text-white shadow-[0_14px_26px_-18px_rgba(11,110,97,0.85)] transition hover:bg-brand-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? (
            <>
              <span className="h-[17px] w-[17px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {p.locating}
            </>
          ) : (
            <>
              <NavIcon className="h-[17px] w-[17px]" />
              {p.useLocation}
            </>
          )}
        </button>
        <button
          type="button"
          disabled
          title={p.preparing}
          className="inline-flex h-[50px] flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl border border-line-2 bg-surface text-sm font-semibold text-ink-2 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PinIcon className="h-[17px] w-[17px]" />
          {p.enterAddress}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-tint px-4 py-3 text-[13.5px] font-medium leading-snug text-danger"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {items != null && !error && items.length === 0 && (
        <div className="mt-4 rounded-[14px] border border-dashed border-line-2 bg-surface px-4 py-12 text-center text-[13px] text-ink-4">
          {p.empty}
        </div>
      )}

      {items != null && items.length > 0 && (
        <div className="mt-4 flex flex-col gap-2.5">
          {items.map((it, i) => (
            <div
              key={`${it.name}-${i}`}
              className="flex items-start gap-3.5 rounded-[14px] border border-line bg-surface p-4 transition hover:border-line-2 hover:shadow-sm sm:px-[18px]"
            >
              <span className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-brand-tint text-[13px] font-extrabold text-brand">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-bold text-ink">{it.name}</h4>
                {it.addr && <p className="mt-1.5 text-[12.5px] text-ink-3">{it.addr}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-medium text-ink-3">
                  {it.distance != null && (
                    <span className="flex items-center gap-1.5">
                      <PinIcon className="h-3.5 w-3.5" />
                      {formatDistance(it.distance)}
                    </span>
                  )}
                  {it.rating != null && (
                    <span className="flex items-center gap-1 text-ink-2">
                      <span className="text-amber-500">★</span>
                      {it.rating.toFixed(1)}
                      {it.ratingCount != null && <span className="text-ink-4">({it.ratingCount})</span>}
                    </span>
                  )}
                  {it.openNow != null && (
                    <span
                      className={
                        it.openNow
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                          : "rounded-full bg-ink-4/10 px-2 py-0.5 text-[11px] font-semibold text-ink-3"
                      }
                    >
                      {it.openNow ? p.open : p.closed}
                    </span>
                  )}
                  {it.phone && (
                    <a href={`tel:${it.phone}`} className="text-brand hover:underline">
                      {it.phone}
                    </a>
                  )}
                </div>
              </div>
              <a
                href={directionsUrl(it)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 self-center rounded-[9px] border border-line bg-surface-soft px-3.5 text-[12.5px] font-semibold text-ink-2 transition hover:border-brand-tint-2 hover:bg-brand-tint hover:text-brand"
              >
                {p.directions}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

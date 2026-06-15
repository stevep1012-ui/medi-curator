"use client";

import { NavIcon, PinIcon, StarIcon } from "./icons";
import { PH_META, useI18n } from "./i18n";

// Map-pin positions (decorative, language-independent)
const PIN_POS = [
  { l: "60%", t: "60px" },
  { l: "74%", t: "150px" },
];

export default function PharmacyFinder() {
  const { t } = useI18n();
  const p = t.pharmacy;

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled
          title={p.preparing}
          className="inline-flex h-[50px] flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl bg-brand text-sm font-bold text-white shadow-[0_14px_26px_-18px_rgba(11,110,97,0.85)] transition disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          <NavIcon className="h-[17px] w-[17px]" />
          {p.useLocation}
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
      <p className="mt-2.5 text-[12.5px] leading-snug text-ink-3">
        {p.previewNote}
      </p>

      {/* Map mock */}
      <div className="relative mt-4 h-[220px] overflow-hidden rounded-[20px] border border-line bg-surface-soft">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,var(--line) 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,var(--line) 0 1px,transparent 1px 40px)",
          }}
        />
        <div className="absolute left-0 right-0 top-[92px] h-3.5 bg-surface" style={{ boxShadow: "0 0 0 1px var(--line)" }} />
        <div className="absolute bottom-0 top-0 left-[38%] w-3 bg-surface" style={{ boxShadow: "0 0 0 1px var(--line)" }} />
        <span className="absolute left-3 top-3 rounded-lg border border-line bg-surface/90 px-2.5 py-1 text-[11.5px] font-semibold text-ink-3">
          {p.within}
        </span>
        {/* current location */}
        <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: "38%", top: "96px" }}>
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#2563eb] text-white shadow-md">
            <span className="text-[13px] font-extrabold leading-none">●</span>
          </span>
        </div>
        {PIN_POS.map((pos, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: pos.l, top: pos.t }}>
            <span
              className="flex h-[28px] w-[28px] items-center justify-center bg-brand shadow-md"
              style={{ borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)" }}
            >
              <span className="text-[13px] font-extrabold leading-none text-white" style={{ transform: "rotate(45deg)" }}>
                +
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center">
        <span className="inline-flex h-6 items-center rounded-full border border-line-2 bg-surface-soft px-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-4">
          {p.demoBadge}
        </span>
      </div>
      <div className="mt-2.5 flex flex-col gap-2.5">
        {p.items.map((item, i) => {
          const meta = PH_META[i];
          return (
            <div
              key={item.name}
              className="flex items-start gap-3.5 rounded-[14px] border border-line bg-surface p-4 transition hover:border-line-2 hover:shadow-sm sm:px-[18px]"
            >
              <span className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-brand-tint text-[13px] font-extrabold text-brand">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h4 className="text-[15px] font-bold text-ink">{item.name}</h4>
                  {meta.open ? (
                    <span className="rounded-full bg-ok-tint px-2 py-[3px] text-[10.5px] font-extrabold text-ok">{p.open}</span>
                  ) : (
                    <span className="rounded-full bg-danger-tint px-2 py-[3px] text-[10.5px] font-extrabold text-danger">{p.closed}</span>
                  )}
                </div>
                <p className="mt-1.5 text-[12.5px] text-ink-3">{item.addr}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] font-medium text-ink-3">
                  <span className="flex items-center gap-1.5">
                    <PinIcon className="h-3.5 w-3.5" />
                    {meta.distance}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#c8910a]">
                    <StarIcon className="h-3.5 w-3.5" />
                    {meta.rating}
                  </span>
                  <span>{item.note}</span>
                </div>
              </div>
              <button
                type="button"
                disabled
                title={p.preparing}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 self-center rounded-[9px] border border-line bg-surface-soft px-3.5 text-[12.5px] font-semibold text-ink-2 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {p.directions}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

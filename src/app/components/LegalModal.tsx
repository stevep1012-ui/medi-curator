"use client";

// Split out of Legal.tsx so Legal.tsx exports only non-components (the LEGAL
// dictionary + types) and this file exports only the modal component
// (react-refresh/only-export-components).
import { useEffect } from "react";
import { useI18n } from "./i18n";
import { LEGAL, type LegalKey } from "./Legal";

export function LegalModal({ docKey, onClose }: { docKey: LegalKey | null; onClose: () => void }) {
  const { lang } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!docKey) return null;
  const doc = LEGAL[lang][docKey];
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "rgba(8,18,17,.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-line bg-surface shadow-[0_30px_90px_-24px_rgba(0,0,0,0.6)] sm:max-h-[86vh] sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[19px] font-bold tracking-tight text-ink">{doc.title}</h2>
            {(docKey === "terms" || docKey === "privacy") && (
              <p className="mt-1 text-[12px] text-ink-4">{LEGAL[lang].updated}</p>
            )}
          </div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-ink-3 transition hover:text-ink" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-[13.5px] leading-relaxed text-ink-2">
          {doc.sections.map(([h, b], i) => (
            <section key={i}>
              <h3 className="mb-1.5 text-[14.5px] font-bold tracking-tight text-ink">{h}</h3>
              <p className="whitespace-pre-line text-ink-2">{b}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

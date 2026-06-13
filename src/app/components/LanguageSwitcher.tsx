"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, GlobeIcon } from "./icons";
import { LANGS, useI18n } from "./i18n";

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-line bg-surface-soft px-2.5 text-[12px] font-semibold text-ink-2 transition hover:bg-surface hover:text-ink"
      >
        <GlobeIcon className="h-4 w-4" />
        <span>{current.native}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.4)]">
          {LANGS.map((l) => {
            const on = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  on ? "bg-brand-tint text-brand" : "text-ink-2 hover:bg-surface-soft"
                }`}
              >
                <span>{l.native}</span>
                {on && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

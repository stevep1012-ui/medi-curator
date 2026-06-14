"use client";

import { useState } from "react";
import { TrashIcon } from "./icons";
import { useI18n } from "./i18n";

interface HistoryItem {
  id: number;
  date: string;
  time: string;
  text: string;
  tag: string;
}

export default function SearchHistory() {
  const { t } = useI18n();
  const h = t.history;

  // No real history store exists yet, so a new user must see the empty state —
  // never fabricated past searches they did not make (alarming in a health/privacy
  // context). When a real per-device/account history source lands, seed from it.
  const [items, setItems] = useState<HistoryItem[]>([]);

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">{h.title}</h3>
        <button
          onClick={() => setItems([])}
          className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3.5 text-[12.5px] font-semibold text-ink-2 transition hover:border-line-2 hover:text-ink"
        >
          {h.clearAll}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line-2 bg-surface px-4 py-12 text-center text-[13px] text-ink-4">
          {h.empty}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-4 rounded-[14px] border border-line bg-surface p-4 transition hover:border-line-2 hover:shadow-sm sm:px-[18px]"
            >
              <div className="w-[74px] shrink-0 text-[11.5px] font-bold leading-snug text-ink-4">
                {it.date}
                <br />
                {it.time}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] leading-snug text-ink">{it.text}</p>
                <span className="mt-1.5 inline-flex h-6 items-center rounded-full bg-brand-tint px-2.5 text-[11.5px] font-bold text-brand">
                  {it.tag}
                </span>
              </div>
              <button
                onClick={() => setItems((cur) => cur.filter((x) => x.id !== it.id))}
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-transparent text-ink-4 transition hover:bg-danger-tint hover:text-danger"
                aria-label={h.delete}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

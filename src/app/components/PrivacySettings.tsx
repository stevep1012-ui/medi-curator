"use client";

import { useState } from "react";
import { TrashIcon } from "./icons";
import { PRIV_ON, useI18n } from "./i18n";

export default function PrivacySettings() {
  const { t } = useI18n();
  const pv = t.privacy;

  const [on, setOn] = useState<boolean[]>(PRIV_ON);
  const toggle = (i: number) => setOn((cur) => cur.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div>
      <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-sm">
        {pv.items.map((s, i) => (
          <div
            key={s.title}
            className={`flex items-center justify-between gap-4 px-5 py-[18px] ${
              i < pv.items.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <div>
              <b className="block text-sm font-bold text-ink">{s.title}</b>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{s.desc}</span>
            </div>
            <button
              onClick={() => toggle(i)}
              role="switch"
              aria-checked={on[i]}
              className={`relative h-[27px] w-[46px] shrink-0 rounded-full transition ${on[i] ? "bg-brand" : "bg-line-2"}`}
            >
              <span
                className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow-sm transition-all ${
                  on[i] ? "left-[22px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-[14px] border border-line bg-surface px-4 py-3.5 text-[13.5px] font-semibold text-ink-2 transition hover:border-line-2 hover:text-ink"
        >
          {pv.policy}
        </a>
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-[14px] border border-line bg-surface px-4 py-3.5 text-[13.5px] font-semibold text-ink-2 transition hover:border-line-2 hover:text-ink"
        >
          {pv.terms}
        </a>
      </div>

      <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-[14px] border border-danger-line bg-danger-tint px-[18px] text-[13.5px] font-bold text-danger transition hover:bg-surface">
        <TrashIcon className="h-[15px] w-[15px]" />
        {pv.deleteAll}
      </button>
    </div>
  );
}

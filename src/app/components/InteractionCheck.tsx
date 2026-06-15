"use client";

import { useState } from "react";
import { InfoIcon, PillIcon, SearchIcon, ShieldCheckIcon } from "./icons";
import { useI18n } from "./i18n";
import { runInteractionCheck, type CheckResult } from "./interactionRules";

export default function InteractionCheck() {
  const { t } = useI18n();
  const x = t.interaction;

  const [query, setQuery] = useState(x.queryVal);
  const [current, setCurrent] = useState(x.currentVal);
  const [result, setResult] = useState<CheckResult | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
        <p className="text-[12.5px] leading-snug text-ink-2">{x.disclaimer}</p>
      </div>

      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-5">
          <label className="space-y-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
              <SearchIcon className="h-3.5 w-3.5 text-ink-3" />
              {x.queryLabel}
            </span>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={x.queryPh}
              rows={2}
              className="w-full resize-y rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
            />
          </label>

          <label className="space-y-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
              <PillIcon className="h-3.5 w-3.5 text-ink-3" />
              {x.currentLabel}
            </span>
            <textarea
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder={x.currentPh}
              rows={3}
              className="w-full resize-y rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
            />
          </label>

          <button
            type="button"
            onClick={() => setResult(runInteractionCheck(query, current))}
            disabled={!query.trim() || !current.trim()}
            className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(11,110,97,0.85)] transition hover:bg-brand-2 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink-4 disabled:shadow-none disabled:hover:translate-y-0"
          >
            <ShieldCheckIcon className="h-[18px] w-[18px]" />
            {x.checkBtn}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-3.5">
          <h2 className="text-[15px] font-bold tracking-tight text-ink">{x.findingsTitle}</h2>

          {/* Non-judgmental notice — the tool no longer renders a danger/caution/safe
              verdict (RT-005: avoid personalized medical judgment). It only surfaces
              topics to confirm with a pharmacist. */}
          <div className="flex items-start gap-3 rounded-[16px] border border-line bg-surface px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink-3">
              <InfoIcon className="h-[18px] w-[18px]" />
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-2">{x.notice}</p>
          </div>

          {result.findings.length === 0 ? (
            <section className="rounded-[18px] border border-line bg-surface p-5 shadow-sm">
              <h3 className="mb-3.5 flex items-center gap-2.5 text-[14px] font-bold tracking-tight text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-soft text-ink-3">
                  <InfoIcon className="h-[15px] w-[15px]" />
                </span>
                {x.safeTitle}
              </h3>
              <p className="text-[13.5px] leading-relaxed text-ink-2">{x.safeDetail}</p>
            </section>
          ) : (
            result.findings.map((f) => {
              const r = x.rules[f.id];
              return (
                <section key={f.id} className="rounded-[16px] border border-line bg-surface p-4 shadow-sm sm:px-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-ink-4" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[14.5px] font-bold text-ink">{r[0]}</h4>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-soft px-2 py-[2px] text-[10.5px] font-extrabold text-ink-3">
                          {x.askPharmacist}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r[1]}</p>
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

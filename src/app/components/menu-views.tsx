"use client";

// Menu view components, split out of Menu.tsx so Menu.tsx exports only data
// (CARD/MENU_ORDER/ACCENT/HOME_HEAD/NAV_HOME + types) and this file exports only
// components (react-refresh/only-export-components).
import type { CSSProperties } from "react";
import { useI18n } from "./i18n";
import { CARD, MENU_ORDER, ACCENT, HOME_HEAD, NAV_HOME, type MenuId, type ViewId } from "./Menu";
import ProductGrowthPanel from "./ProductGrowthPanel";

export function MenuCards({ onPick, uid }: { onPick: (id: MenuId) => void; uid?: string }) {
  const { lang } = useI18n();
  return (
    <>
      <section className="mt-9 sm:mt-12">
        <h2 className="mb-7 text-center text-[13px] font-semibold tracking-tight text-ink-3">{HOME_HEAD[lang][2]}</h2>
        <div id="cardGrid" className="flex flex-wrap justify-center gap-x-7 gap-y-8 sm:gap-x-12 sm:gap-y-9">
          {MENU_ORDER.map((id, i) => {
            const m = CARD[id];
            const base = i * 150;
            return (
              <button key={id} onClick={() => onPick(id)} className="group flex flex-col items-center" style={{ "--a": ACCENT[id] } as CSSProperties}>
                <div className="step-badge" style={{ animationDelay: `${base}ms` }}>
                  <div
                    className="mbadge flex h-[56px] w-[56px] items-center justify-center rounded-[16px] ring-1 ring-black/[0.04]"
                    style={{ boxShadow: "0 10px 24px -16px var(--a)" }}
                  >
                    <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]" fill="currentColor">
                      {m.svg}
                    </svg>
                  </div>
                </div>
                <div
                  className="step-line mline h-5 w-px bg-line-2 transition-colors duration-300"
                  style={{ animationDelay: `${base + 170}ms` }}
                />
                <span
                  className="step-label mlabel whitespace-nowrap text-[12.5px] font-semibold tracking-tight text-ink-3 transition-colors duration-300"
                  style={{ animationDelay: `${base + 300}ms` }}
                >
                  {m.label[lang]}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <ProductGrowthPanel uid={uid} onGo={onPick} />
    </>
  );
}

/** Tool-screen nav bar: home / prev / next (cards-only navigation, Option B). */
export function ToolNav({ active, onGo }: { active: MenuId; onGo: (id: ViewId) => void }) {
  const { lang } = useI18n();
  const idx = MENU_ORDER.indexOf(active);
  const prev = MENU_ORDER[(idx - 1 + MENU_ORDER.length) % MENU_ORDER.length];
  const next = MENU_ORDER[(idx + 1) % MENU_ORDER.length];
  const arrow =
    "flex h-10 w-10 items-center justify-center rounded-[12px] border border-line bg-surface text-[18px] font-bold text-ink-3 transition hover:border-brand-tint-2 hover:text-brand";
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <button
        onClick={() => onGo("home")}
        className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-[13.5px] font-semibold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand"
      >
        <span className="text-[16px] leading-none">←</span>
        {NAV_HOME[lang]}
      </button>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onGo(prev)} title={CARD[prev].label[lang]} className={arrow}>
          ‹
        </button>
        <span className="flex items-center gap-1.5 whitespace-nowrap px-2 text-[13.5px] font-bold" style={{ color: ACCENT[active] }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT[active] }} />
          {CARD[active].label[lang]}
        </span>
        <button onClick={() => onGo(next)} title={CARD[next].label[lang]} className={arrow}>
          ›
        </button>
      </div>
    </div>
  );
}

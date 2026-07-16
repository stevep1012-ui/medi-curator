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
      <section className="home-tools-3d mt-9 sm:mt-12">
        <h2 className="mb-7 text-center text-[13px] font-semibold tracking-tight text-ink-3">{HOME_HEAD[lang][2]}</h2>
        <div id="cardGrid" className="flex flex-wrap justify-center gap-x-7 gap-y-8 sm:gap-x-12 sm:gap-y-9">
          {MENU_ORDER.map((id, i) => {
            const m = CARD[id];
            const base = i * 150;
            return (
              <button key={id} onClick={() => onPick(id)} className="group menu-card-3d flex flex-col items-center" style={{ "--a": ACCENT[id], animationDelay: `${base}ms` } as CSSProperties}>
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
      <ProductGrowthPanel key={uid ?? "local"} uid={uid} onGo={onPick} />
    </>
  );
}

/** Tool-screen nav bar: direct access to every tool without returning home. */
export function ToolNav({ active, onGo }: { active: MenuId; onGo: (id: ViewId) => void }) {
  const { lang } = useI18n();
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        onClick={() => onGo("home")}
        className="inline-flex h-10 w-fit items-center gap-2 rounded-[12px] border border-line bg-surface px-4 text-[13.5px] font-semibold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand"
      >
        <span className="text-[16px] leading-none">←</span>
        {NAV_HOME[lang]}
      </button>
      <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface-soft p-1">
        {MENU_ORDER.map((id) => {
          const current = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onGo(id)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-[12.5px] font-extrabold transition ${
                current ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:bg-surface hover:text-ink"
              }`}
              style={current ? { color: ACCENT[id] } : undefined}
              aria-current={current ? "page" : undefined}
            >
              {CARD[id].label[lang]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

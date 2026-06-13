"use client";

import type { ReactNode } from "react";
import { HistoryIcon, PinIcon, PulseIcon, ShieldCheckIcon, ShieldIcon } from "./icons";
import { useI18n } from "./i18n";

export type TabId = "symptom" | "interaction" | "pharmacy" | "history" | "privacy";

const TAB_META: { id: TabId; icon: ReactNode }[] = [
  { id: "symptom", icon: <PulseIcon className="h-[17px] w-[17px]" /> },
  { id: "interaction", icon: <ShieldCheckIcon className="h-[17px] w-[17px]" /> },
  { id: "pharmacy", icon: <PinIcon className="h-[17px] w-[17px]" /> },
  { id: "history", icon: <HistoryIcon className="h-[17px] w-[17px]" /> },
  { id: "privacy", icon: <ShieldIcon className="h-[17px] w-[17px]" /> },
];

/**
 * Vertical file-folder side tabs (horizontal scroll strip on mobile).
 * The active tab merges seamlessly into the panel card to its right.
 */
export function FolderTabs({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  const { t } = useI18n();
  const base =
    "ftab inline-flex items-center gap-2.5 whitespace-nowrap rounded-[13px] border px-3.5 py-2.5 text-[13px] font-semibold sm:w-full sm:rounded-r-none sm:border-r-0 sm:px-4 sm:py-3 sm:text-[13.5px] sm:mr-[-1px]";

  return (
    <nav
      role="tablist"
      aria-label="Sections"
      className="flex gap-2 overflow-x-auto pb-1 sm:w-[182px] sm:shrink-0 sm:flex-col sm:gap-2.5 sm:overflow-visible sm:pb-0 sm:pt-3"
    >
      {TAB_META.map((tab) => {
        const on = tab.id === active;
        const cls = on
          ? base +
            " bg-surface text-ink border-brand-tint-2 sm:z-10 sm:border-l-[3px] sm:border-l-brand sm:shadow-[-7px_0_18px_-14px_rgba(0,0,0,0.5)]"
          : base + " bg-surface-soft text-ink-3 border-line hover:bg-surface hover:text-ink sm:z-0";
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            className={cls}
          >
            <span className={`shrink-0 ${on ? "text-brand" : "text-ink-4"}`}>{tab.icon}</span>
            {t.tabs[tab.id][0]}
          </button>
        );
      })}
    </nav>
  );
}

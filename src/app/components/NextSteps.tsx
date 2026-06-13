"use client";

import type { CSSProperties } from "react";
import { useI18n, type Lang } from "./i18n";
import { ACCENT, CARD, type MenuId } from "./Menu";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

type StepKey = "toPharmacy" | "consult" | "toInteraction" | "toVitamin" | "toSymptom" | "privacy";
type Step = [StepKey, MenuId];

const LABEL: Record<StepKey, ML> = {
  toPharmacy: ml("독립 약국 검색", "Independent pharmacy finder", "独立した薬局検索", "独立药房查找"),
  consult: ml("전문가 상담 준비", "Prepare for consultation", "専門職への相談準備", "准备专业咨询"),
  toInteraction: ml("복용 정보 정리", "Organize medication info", "服用情報を整理", "整理用药信息"),
  toVitamin: ml("생활관리 정보 보기", "View self-care info", "セルフケア情報を見る", "查看自我护理信息"),
  toSymptom: ml("증상 정리하기", "Organize symptoms", "症状を整理", "整理症状"),
  privacy: ml("개인정보 설정", "Privacy settings", "プライバシー設定", "隐私设置"),
};
const TITLE = ml("이어서 하면 좋아요", "Helpful next steps", "次におすすめ", "建议的下一步");

const FLOW: Record<MenuId, Step[]> = {
  symptom: [["toInteraction", "interaction"], ["privacy", "privacy"]],
  interaction: [["consult", "pharmacy"], ["privacy", "privacy"]],
  vitamin: [["toInteraction", "interaction"], ["privacy", "privacy"]],
  pharmacy: [["toSymptom", "symptom"], ["toInteraction", "interaction"]],
  history: [["toSymptom", "symptom"], ["toVitamin", "vitamin"]],
  privacy: [],
};

export default function NextSteps({ active, onGo }: { active: MenuId; onGo: (id: MenuId) => void }) {
  const { lang } = useI18n();
  const flow = FLOW[active];
  if (!flow || flow.length === 0) return null;

  return (
    <div className="mt-7 border-t border-line pt-6">
      <div className="mb-3.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
        <span className="h-1 w-5 rounded-full" style={{ background: "var(--tool, var(--brand))" }} />
        {TITLE[lang]}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {flow.map(([key, target]) => {
          const tone = ACCENT[target];
          return (
            <button
              key={`${active}-${key}-${target}`}
              onClick={() => onGo(target)}
              className="group/step flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ "--a": tone } as CSSProperties}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "color-mix(in srgb, var(--a) 13%, transparent)", color: "var(--a)" }}
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
                  {CARD[target].svg}
                </svg>
              </span>
              <span className="min-w-0 flex-1 text-[13.5px] font-bold leading-snug text-ink">{LABEL[key][lang]}</span>
              <span className="text-[16px] font-bold transition group-hover/step:translate-x-0.5" style={{ color: "var(--a)" }}>
                →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

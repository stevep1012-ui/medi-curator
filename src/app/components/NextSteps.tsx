"use client";

import type { CSSProperties } from "react";
import { useI18n, type Lang } from "./i18n";
import { ACCENT, CARD, type MenuId } from "./Menu";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

type StepKey = "toPharmacy" | "toInteraction" | "toVitamin" | "toSymptom" | "toMeds" | "toHistory";
type Step = [StepKey, MenuId];

const LABEL: Record<StepKey, ML> = {
  toPharmacy: ml("가까운 약국 상담처 찾기", "Find a nearby pharmacy", "近くの薬局を探す", "查找附近药房"),
  toInteraction: ml("복용 정보 정리", "Organize medication info", "服用情報を整理", "整理用药信息"),
  toVitamin: ml("꿀조합 보관함 채우기", "Build combo vault", "組み合わせ保管庫を作る", "建立搭配库"),
  toSymptom: ml("증상 정리하기", "Organize symptoms", "症状を整理", "整理症状"),
  toMeds: ml("약·비타민 목록 저장", "Save meds and vitamins", "薬・サプリを保存", "保存药品和维生素"),
  toHistory: ml("기록 확인", "Review history", "履歴を確認", "查看记录"),
};
const TITLE = ml("이어서 하면 좋아요", "Helpful next steps", "次におすすめ", "建议的下一步");

const FLOW: Record<MenuId, Step[]> = {
  symptom: [["toInteraction", "interaction"], ["toHistory", "history"]],
  interaction: [["toPharmacy", "pharmacy"], ["toHistory", "history"]],
  vitamin: [["toMeds", "mymeds"], ["toInteraction", "interaction"]],
  mymeds: [["toInteraction", "interaction"], ["toVitamin", "vitamin"]],
  pharmacy: [["toSymptom", "symptom"], ["toMeds", "mymeds"]],
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

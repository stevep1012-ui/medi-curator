"use client";

import type { CSSProperties, ReactNode } from "react";
import { useI18n, type Lang } from "./i18n";

export type MenuId =
  | "symptom"
  | "interaction"
  | "vitamin"
  | "pharmacy"
  | "history"
  | "privacy";
export type ViewId = MenuId | "home";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

type CardMeta = {
  grad: string;
  sh: string;
  bg: string;
  csh: string;
  cshH: string;
  label: ML;
  desc: ML;
  svg: ReactNode;
};

/** Home menu cards — localized labels/descriptions + per-tool visuals. Order = MENU_ORDER. */
export const CARD: Record<MenuId, CardMeta> = {
  symptom: {
    grad: "from-blue-500 to-cyan-500",
    sh: "rgba(37,99,235,0.6)",
    bg: "from-blue-400/20 to-cyan-300/10",
    csh: "rgba(59,130,246,0.3)",
    cshH: "rgba(59,130,246,0.5)",
    label: ml("증상 분석", "Symptom analysis", "症状分析", "症状分析"),
    desc: ml(
      "증상을 입력하면 가능한 일반의약품과 주의사항을 안내합니다.",
      "Enter symptoms for OTC suggestions and cautions.",
      "症状を入力すると市販薬や注意点を案内します。",
      "输入症状，获取非处方药建议与注意事项。",
    ),
    svg: (
      <>
        <path d="M9.5 3.5a4.5 4.5 0 0 1 6.4 6.3l-6.1 6.1a4.5 4.5 0 0 1-6.4-6.3l6.1-6.1Zm-1 7.6 4.6-4.6a2.5 2.5 0 0 0-3.5-.05L5.4 10.2a2.5 2.5 0 0 0 .05 3.5l3.05-2.6Z" />
        <path d="M17 13a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm-2 4h4v-1.4h-4V17Z" />
      </>
    ),
  },
  interaction: {
    grad: "from-amber-500 to-orange-500",
    sh: "rgba(217,119,6,0.6)",
    bg: "from-amber-400/20 to-orange-300/10",
    csh: "rgba(217,119,6,0.3)",
    cshH: "rgba(217,119,6,0.5)",
    label: ml("복용 검사", "Safety check", "服用チェック", "服用检查"),
    desc: ml(
      "새 약과 현재 복용 중인 약의 상호작용을 확인합니다.",
      "Check interactions between new and current meds.",
      "新しい薬と服用中の薬の相互作用を確認。",
      "检查新药与在服药物的相互作用。",
    ),
    svg: (
      <>
        <path d="M10.4 3.6a4.5 4.5 0 0 1 6.4 6.3l-6.9 6.9a4.5 4.5 0 0 1-6.4-6.3l6.9-6.9Zm-.7 8 3.6-3.6a2.5 2.5 0 0 0-3.5-3.5L6.2 8.1l3.5 3.5Z" />
        <circle cx="17.5" cy="17.5" r="3.7" />
        <path d="M15.4 17.5h4.2" stroke="white" strokeWidth="1.3" />
      </>
    ),
  },
  vitamin: {
    grad: "from-teal-500 to-lime-500",
    sh: "rgba(20,184,166,0.6)",
    bg: "from-teal-400/20 to-lime-300/10",
    csh: "rgba(20,184,166,0.3)",
    cshH: "rgba(20,184,166,0.5)",
    label: ml("비타민 궁합", "Vitamin pairing", "ビタミンの相性", "维生素搭配"),
    desc: ml(
      "목표를 고르면 함께 먹으면 좋은 영양제 조합을 추천합니다.",
      "Pick a goal for a recommended supplement combo.",
      "目標を選ぶと相性の良いサプリの組み合わせを提案。",
      "选择目标，推荐适合搭配的营养组合。",
    ),
    svg: (
      <>
        <path d="M12 2l1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2Z" />
        <path d="M18 13l.9 2.1 2.1.9-2.1.9L18 19l-.9-2.1L15 16l2.1-.9L18 13Z" />
        <path d="M6 13l.9 2.1L9 16l-2.1.9L6 19l-.9-2.1L3 16l2.1-.9L6 13Z" />
      </>
    ),
  },
  pharmacy: {
    grad: "from-rose-500 to-red-500",
    sh: "rgba(239,68,68,0.6)",
    bg: "from-red-400/20 to-rose-300/10",
    csh: "rgba(239,68,68,0.3)",
    cshH: "rgba(239,68,68,0.5)",
    label: ml("약국 찾기", "Find pharmacy", "薬局を探す", "查找药房"),
    desc: ml(
      "근처 약국의 영업시간과 거리를 확인합니다.",
      "See nearby pharmacy hours and distance.",
      "近くの薬局の営業時間と距離を確認。",
      "查看附近药房的营业时间与距离。",
    ),
    svg: <path d="M12 2c-3.9 0-7 3-7 6.9 0 4.3 4.6 9.5 6.3 11.3.4.4 1 .4 1.4 0C14.4 18.4 19 13.2 19 8.9 19 5 15.9 2 12 2Zm0 4.2h1.4v2h2v1.4h-2v2H12v-2h-2V8.2h2v-2Z" />,
  },
  history: {
    grad: "from-violet-500 to-purple-500",
    sh: "rgba(168,85,247,0.6)",
    bg: "from-purple-400/20 to-violet-300/10",
    csh: "rgba(168,85,247,0.3)",
    cshH: "rgba(168,85,247,0.5)",
    label: ml("검색 기록", "Search history", "検索履歴", "搜索记录"),
    desc: ml(
      "지난 검색 내역을 다시 확인하고 관리합니다.",
      "Revisit and manage past searches.",
      "過去の検索を再確認・管理。",
      "回顾并管理过往搜索。",
    ),
    svg: (
      <>
        <path d="M12 3a9 9 0 1 0 8.5 6 1 1 0 0 0-1.9.6A7 7 0 1 1 12 5v2.2c0 .5.6.8 1 .4l3.4-2.8a.5.5 0 0 0 0-.8L13 1.3c-.4-.3-1 0-1 .5V3Z" />
        <path d="M11 8v4.5l3 1.8 1-1.6-2.5-1.5V8H11Z" />
      </>
    ),
  },
  privacy: {
    grad: "from-slate-600 to-slate-500",
    sh: "rgba(71,85,105,0.6)",
    bg: "from-slate-400/20 to-slate-300/10",
    csh: "rgba(71,85,105,0.3)",
    cshH: "rgba(71,85,105,0.5)",
    label: ml("개인정보", "Privacy", "プライバシー", "隐私"),
    desc: ml(
      "건강 데이터 권한과 저장을 직접 관리합니다.",
      "Manage health-data permissions and storage.",
      "健康データの権限と保存を管理。",
      "管理健康数据权限与存储。",
    ),
    svg: <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Zm3.6 6.7-4.3 4.3a1 1 0 0 1-1.4 0L7.7 11l1.4-1.4 1.5 1.5 3.6-3.6 1.4 1.2Z" />,
  },
};

export const MENU_ORDER: MenuId[] = [
  "symptom",
  "interaction",
  "vitamin",
  "pharmacy",
  "history",
  "privacy",
];

/** Per-tool accent colours — muted, editorial (adds colour without the rainbow). */
export const ACCENT: Record<MenuId, string> = {
  symptom: "#0a7d6e",
  interaction: "#b5781a",
  vitamin: "#2f9e44",
  pharmacy: "#c2452f",
  history: "#5b6ad0",
  privacy: "#5f7079",
};

/** Home hero head [title, sub] + grid section label, per language */
export const HOME_HEAD: Record<Lang, [string, string, string]> = {
  ko: [
    "무엇을 도와드릴까요?",
    "필요한 도구를 선택하세요. 증상 분석부터 비타민 궁합까지 차분하게 안내합니다.",
    "어떤 도움이 필요하신가요?",
  ],
  en: [
    "How can we help?",
    "Pick a tool below — from symptom analysis to vitamin pairing, a calm starting point.",
    "What do you need help with?",
  ],
  ja: [
    "何をお手伝いしますか？",
    "下のツールを選んでください。症状分析からビタミンの相性まで、落ち着いて案内します。",
    "どんなサポートが必要ですか？",
  ],
  zh: [
    "需要什么帮助？",
    "请选择下方工具，从症状分析到维生素搭配，从容开始。",
    "您需要哪方面的帮助？",
  ],
};

export const NAV_HOME: Record<Lang, string> = { ko: "홈", en: "Home", ja: "ホーム", zh: "首页" };

/** Home menu grid — localized cards that act as the primary navigation. */
export function MenuCards({ onPick }: { onPick: (id: MenuId) => void }) {
  const { lang } = useI18n();
  return (
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

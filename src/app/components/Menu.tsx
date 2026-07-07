"use client";

import type { ReactNode } from "react";
import { type Lang } from "./i18n";

export type MenuId =
  | "symptom"
  | "interaction"
  | "vitamin"
  | "mymeds"
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
      "증상을 정리하고 상담 전 확인할 질문과 위험 신호를 안내합니다.",
      "Enter symptoms to organize questions and red flags before consultation.",
      "症状を整理し、相談前の質問と危険な兆候を確認します。",
      "输入症状，整理咨询问题并查看危险信号。",
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
      "복용 정보를 정리하고 전문가에게 확인할 항목을 표시합니다.",
      "Organize medication information and items to verify with a professional.",
      "服用情報を整理し、専門職に確認する項目を表示します。",
      "整理用药信息，并显示需要向专业人员确认的项目。",
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
  mymeds: {
    grad: "from-emerald-500 to-green-500",
    sh: "rgba(16,185,129,0.6)",
    bg: "from-emerald-400/20 to-green-300/10",
    csh: "rgba(16,185,129,0.3)",
    cshH: "rgba(16,185,129,0.5)",
    label: ml("내 약·비타민", "My meds", "私の薬", "我的药品"),
    desc: ml(
      "약·영양제를 촬영하면 성분·효능을 기기에 기록해 다시 확인합니다.",
      "Scan meds to record ingredients and uses on your device.",
      "薬やサプリを撮影し、成分・効能を端末に記録。",
      "拍摄药品，将成分与功效记录在本机。",
    ),
    svg: (
      <>
        <rect x="3" y="8.5" width="18" height="8" rx="4" />
        <path d="M12 8.5v8" />
        <path d="M16 3.5l1.4 1.4-2.6 2.6-1.4-1.4 2.6-2.6Z" />
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
  "mymeds",
  "pharmacy",
  "history",
  "privacy",
];

/** Per-tool accent colours — muted, editorial (adds colour without the rainbow). */
export const ACCENT: Record<MenuId, string> = {
  symptom: "#0a7d6e",
  interaction: "#b5781a",
  vitamin: "#2f9e44",
  mymeds: "#0e9f6e",
  pharmacy: "#c2452f",
  history: "#5b6ad0",
  privacy: "#5f7079",
};

/** Home hero head [title, sub] + grid section label, per language */
export const HOME_HEAD: Record<Lang, [string, string, string]> = {
  ko: [
    "약과 증상을 매일 관리하는 AI 건강 노트",
    "촬영, 저장, 상담 준비까지 한 흐름으로 묶어 반복해서 쓸 이유를 만듭니다.",
    "오늘 할 일을 선택하세요",
  ],
  en: [
    "An AI health notebook for meds and symptoms",
    "Capture, save, and prepare for consultation in one repeatable daily flow.",
    "Choose today's task",
  ],
  ja: [
    "薬と症状を毎日管理するAI健康ノート",
    "撮影、保存、相談準備までを一つの流れにします。",
    "今日のタスクを選択",
  ],
  zh: [
    "管理药品和症状的 AI 健康笔记",
    "把拍照、保存和咨询准备整合为可重复的日常流程。",
    "选择今天要做的事",
  ],
};

export const NAV_HOME: Record<Lang, string> = { ko: "홈", en: "Home", ja: "ホーム", zh: "首页" };

/** Home menu grid — localized cards that act as the primary navigation. */

"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, HistoryIcon, PillIcon, SearchIcon, ShieldCheckIcon, StarIcon } from "./icons";
import { useI18n, type Lang } from "./i18n";
import type { MenuId } from "./Menu";
import { loadMeds } from "../../services/medStore";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

type RoutineKey = "meds" | "symptoms" | "interaction" | "pharmacy";
type RoutineItem = {
  key: RoutineKey;
  target: MenuId;
  label: ML;
  value: ML;
  icon: "pill" | "search" | "shield" | "history";
};

const COPY = {
  eyebrow: ml("지속 사용 루틴", "Retention routine", "継続利用ルーティン", "持续使用流程"),
  title: ml("3분 건강 점검을 매일 이어가세요", "Keep a 3-minute health check-in", "3分の健康チェックを続けましょう", "坚持 3 分钟健康检查"),
  body: ml(
    "약 목록을 저장하고, 증상을 정리하고, 상담 전 확인할 항목을 남기면 앱을 다시 열 이유가 생깁니다.",
    "Save meds, organize symptoms, and keep consultation-ready notes so the app stays useful every day.",
    "薬リスト、症状整理、相談前メモを続けると、毎日使う理由が生まれます。",
    "保存药品、整理症状并保留咨询前要点，让应用每天都有用。",
  ),
  progress: ml("오늘 진행률", "Today's progress", "今日の進捗", "今日进度"),
  streak: ml("연속 점검", "Check-in streak", "連続チェック", "连续检查"),
  dayUnit: ml("일", "days", "日", "天"),
  medsSaved: ml("저장된 약", "Saved meds", "保存済みの薬", "已保存药品"),
  exportTitle: ml("상담용 요약", "Consultation brief", "相談用サマリー", "咨询摘要"),
  exportBody: ml(
    "기기에 저장된 약 이름과 오늘 루틴을 텍스트 파일로 내보냅니다. 사진과 원문 증상은 포함하지 않습니다.",
    "Export saved medicine names and today's routine as a text file. Photos and raw symptoms are not included.",
    "保存済みの薬名と今日のルーティンをテキストで書き出します。写真や症状原文は含めません。",
    "将已保存药名和今日流程导出为文本文件。不包含照片和原始症状。",
  ),
  exportCta: ml("요약 내보내기", "Export brief", "書き出す", "导出摘要"),
  exported: ml("상담용 요약 파일을 만들었어요.", "Consultation brief created.", "相談用サマリーを作成しました。", "已创建咨询摘要。"),
  premiumTitle: ml("사용자가 지갑을 열 만한 가치", "Value worth paying for", "支払う価値", "值得付费的价值"),
  premiumBody: ml(
    "무료로 신뢰를 쌓고, 상담 준비·가족 관리·반복 리포트를 Plus 가치로 전환합니다.",
    "Earn trust for free, then convert consultation prep, family care, and recurring reports into Plus value.",
    "反復ルーティン、相談準備、ローカル薬リスト再利用が有料価値の土台です。まず無料体験で信頼を作ります。",
    "重复流程、咨询准备和本地药品列表复用，是付费价值基础。先用免费体验建立信任。",
  ),
  planTitle: ml("Plus로 열릴 기능", "What Plus unlocks", "Plusで使える機能", "Plus 解锁功能"),
  planBody: ml(
    "결제는 아직 연결하지 않았습니다. 대신 사용 의향을 로컬에 표시해 다음 출시 판단에 반영합니다.",
    "Payment is not connected yet. Mark interest locally so the next release decision can use the signal.",
    "決済はまだ接続していません。利用意向を端末に保存し、次のリリース判断に使います。",
    "尚未连接支付。可在本机标记意向，用于下一次发布判断。",
  ),
  planCta: ml("Plus 관심 등록", "Register interest", "関心を登録", "登记兴趣"),
  planSaved: ml("관심 등록됨", "Interest saved", "登録済み", "已登记"),
  disclaimer: ml(
    "본 기능은 상담 준비용 정리 도구이며 진단이나 처방을 제공하지 않습니다.",
    "This is a consultation-prep tool and does not provide diagnosis or prescriptions.",
    "これは相談準備用の整理ツールであり、診断や処方ではありません。",
    "此功能用于咨询前整理，不提供诊断或处方。",
  ),
} as const;

const PLUS_FEATURES: ML[] = [
  ml("상담용 요약 PDF와 공유 링크", "Consultation PDF and share link", "相談用PDFと共有リンク", "咨询 PDF 与分享链接"),
  ml("가족·보호자 약 목록 분리 관리", "Separate family and caregiver med lists", "家族・介護者の薬リスト管理", "家庭/照护者药品列表管理"),
  ml("주간 점검 리포트와 리마인더", "Weekly check-in reports and reminders", "週次レポートとリマインダー", "每周检查报告与提醒"),
];

const ROUTINE: RoutineItem[] = [
  {
    key: "meds",
    target: "mymeds",
    label: ml("약 목록 정리", "Build med list", "薬リスト整理", "整理药品列表"),
    value: ml("사진 인식 후 저장", "Scan and save", "撮影して保存", "拍照并保存"),
    icon: "pill",
  },
  {
    key: "symptoms",
    target: "symptom",
    label: ml("증상 정리", "Organize symptoms", "症状整理", "整理症状"),
    value: ml("상담 전 질문 준비", "Prepare questions", "相談前の質問", "准备咨询问题"),
    icon: "search",
  },
  {
    key: "interaction",
    target: "interaction",
    label: ml("복용 확인", "Medication check", "服用確認", "用药检查"),
    value: ml("전문가 확인 항목", "Items to verify", "確認項目", "需确认项目"),
    icon: "shield",
  },
  {
    key: "pharmacy",
    target: "pharmacy",
    label: ml("약국 찾기", "Find pharmacy", "薬局検索", "查找药房"),
    value: ml("필요할 때 바로 이동", "Nearby help", "近くの相談先", "附近咨询点"),
    icon: "history",
  },
];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(uid: string | undefined): string {
  return `medi-curator:growth:${uid ?? "local"}`;
}

function iconFor(item: RoutineItem, className: string) {
  if (item.icon === "pill") return <PillIcon className={className} />;
  if (item.icon === "search") return <SearchIcon className={className} />;
  if (item.icon === "shield") return <ShieldCheckIcon className={className} />;
  return <HistoryIcon className={className} />;
}

function readDone(uid: string | undefined): Record<string, RoutineKey[]> {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(uid)) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDone(uid: string | undefined, data: Record<string, RoutineKey[]>) {
  localStorage.setItem(storageKey(uid), JSON.stringify(data));
}

function streakFrom(data: Record<string, RoutineKey[]>): number {
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!data[key]?.length) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ProductGrowthPanel({ uid, onGo }: { uid?: string; onGo: (id: MenuId) => void }) {
  const { lang } = useI18n();
  const [doneByDate, setDoneByDate] = useState<Record<string, RoutineKey[]>>(() => readDone(uid));
  const [exported, setExported] = useState(false);
  const [plusInterest, setPlusInterest] = useState(() => localStorage.getItem("medi-curator:plus-interest") === "yes");
  const today = todayKey();
  const done = doneByDate[today] ?? [];
  const meds = useMemo(() => loadMeds(uid), [uid]);
  const progress = Math.round((done.length / ROUTINE.length) * 100);
  const streak = streakFrom(doneByDate);

  useEffect(() => {
    setDoneByDate(readDone(uid));
  }, [uid]);

  function markAndGo(item: RoutineItem) {
    setDoneByDate((cur) => {
      const todayDone = new Set(cur[today] ?? []);
      todayDone.add(item.key);
      const next = { ...cur, [today]: Array.from(todayDone) as RoutineKey[] };
      writeDone(uid, next);
      return next;
    });
    onGo(item.target);
  }

  function exportBrief() {
    const medNames = meds.map((m) => m.name).filter(Boolean);
    const routineLines = ROUTINE.map((item) => `- ${item.label[lang]}: ${done.includes(item.key) ? "done" : "pending"}`);
    const text = [
      "MediQ consultation brief",
      `Date: ${today}`,
      "",
      "Saved medicines on this device:",
      medNames.length ? medNames.map((name) => `- ${name}`).join("\n") : "- none saved",
      "",
      "Today's routine:",
      routineLines.join("\n"),
      "",
      COPY.disclaimer[lang],
    ].join("\n");
    downloadText(`mediq-consult-brief-${today}.txt`, text);
    setExported(true);
  }

  function savePlusInterest() {
    localStorage.setItem("medi-curator:plus-interest", "yes");
    setPlusInterest(true);
  }

  return (
    <section className="growth-3d-entrance mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="self-start rounded-[24px] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">{COPY.eyebrow[lang]}</p>
            <h2 className="mt-2 text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[26px]">
              {COPY.title[lang]}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{COPY.body[lang]}</p>
          </div>
          <div className="grid min-w-[180px] grid-cols-3 gap-2 rounded-2xl border border-line bg-surface-soft p-2 text-center">
            <div className="rounded-xl bg-surface px-2 py-3">
              <p className="text-[18px] font-black text-brand">{progress}%</p>
              <p className="mt-1 text-[10.5px] font-bold text-ink-4">{COPY.progress[lang]}</p>
            </div>
            <div className="rounded-xl bg-surface px-2 py-3">
              <p className="text-[18px] font-black text-ink">{streak}</p>
              <p className="mt-1 text-[10.5px] font-bold text-ink-4">{COPY.dayUnit[lang]}</p>
            </div>
            <div className="rounded-xl bg-surface px-2 py-3">
              <p className="text-[18px] font-black text-ink">{meds.length}</p>
              <p className="mt-1 text-[10.5px] font-bold text-ink-4">{COPY.medsSaved[lang]}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {ROUTINE.map((item) => {
            const checked = done.includes(item.key);
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => markAndGo(item)}
                className="group routine-card-3d flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-brand-tint-2 hover:shadow-md active:translate-y-0"
                style={{ animationDelay: `${120 + ROUTINE.indexOf(item) * 70}ms` }}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-brand text-white" : "bg-brand-tint text-brand"}`}>
                  {checked ? <CheckIcon className="h-[18px] w-[18px]" /> : iconFor(item, "h-[18px] w-[18px]")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-extrabold text-ink">{item.label[lang]}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{item.value[lang]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="growth-aside-3d self-start rounded-[24px] border border-brand-tint-2 bg-brand-tint/45 p-5 shadow-sm sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
          <StarIcon className="h-[18px] w-[18px]" />
        </div>
        <h3 className="mt-4 text-[18px] font-extrabold tracking-[-0.02em] text-ink">{COPY.premiumTitle[lang]}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{COPY.premiumBody[lang]}</p>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <h4 className="text-[13px] font-extrabold text-ink">{COPY.planTitle[lang]}</h4>
          <div className="mt-3 grid gap-2">
            {PLUS_FEATURES.map((feature) => (
              <div key={feature[lang]} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink-2">
                <CheckIcon className="mt-0.5 h-[14px] w-[14px] shrink-0 text-brand" />
                <span>{feature[lang]}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">{COPY.planBody[lang]}</p>
          <button
            type="button"
            onClick={savePlusInterest}
            disabled={plusInterest}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-[12.5px] font-extrabold text-white transition hover:bg-brand-2 active:scale-[0.98] disabled:bg-ink-4"
          >
            {plusInterest ? COPY.planSaved[lang] : COPY.planCta[lang]}
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <h4 className="text-[13px] font-extrabold text-ink">{COPY.exportTitle[lang]}</h4>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">{COPY.exportBody[lang]}</p>
          <button
            type="button"
            onClick={exportBrief}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-ink px-4 text-[12.5px] font-extrabold text-surface transition hover:opacity-90 active:scale-[0.98]"
          >
            {COPY.exportCta[lang]}
          </button>
          {exported && <p className="mt-2 text-[11.5px] font-bold text-brand">{COPY.exported[lang]}</p>}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">{COPY.disclaimer[lang]}</p>
      </aside>
    </section>
  );
}

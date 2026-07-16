"use client";

import { useMemo, useState } from "react";
import { CheckIcon, HistoryIcon, PillIcon, SearchIcon, ShieldCheckIcon, StarIcon } from "./icons";
import { useI18n, type Lang } from "./i18n";
import type { MenuId } from "./Menu";
import { loadMeds } from "../../services/medStore";
import { loadSavedCombos } from "../../services/comboVaultService";
import { buildConsultationBrief } from "../../services/consultationBriefService";
import { loadPlusInterest, savePlusInterest } from "../../services/plusInterestService";
import { loadRoutineProgress, saveRoutineProgress, type RoutineProgressByDate, type RoutineProgressKey } from "../../services/routineProgressService";
import { loadRoutineReminder, reminderSummary, saveRoutineReminder, type RoutineReminderFrequency } from "../../services/routineReminderService";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

type RoutineItem = {
  key: RoutineProgressKey;
  target: MenuId;
  label: ML;
  value: ML;
  icon: "pill" | "combo" | "search" | "shield" | "history";
};

const COPY = {
  eyebrow: ml("구독 가치 루프", "Subscription value loop", "継続価値ループ", "订阅价值流程"),
  title: ml("돈 내고 쓰는 이유는 반복 사용에서 나옵니다", "Paid value comes from repeat use", "有料価値は反復利用から生まれます", "付费价值来自重复使用"),
  body: ml(
    "약 사진을 저장 가능한 텍스트로 바꾸고, 증상과 복용 확인을 상담용 요약으로 이어줍니다.",
    "Turn med photos into reusable text, then connect symptoms and safety checks into a consultation brief.",
    "薬写真を再利用できるテキストに変え、症状と服用確認を相談用要約につなげます。",
    "把药品照片变成可复用文字，并把症状和用药检查整理为咨询摘要。",
  ),
  progress: ml("오늘 진행률", "Today's progress", "今日の進捗", "今日进度"),
  streak: ml("연속 점검", "Check-in streak", "連続チェック", "连续检查"),
  dayUnit: ml("일", "days", "日", "天"),
  medsSaved: ml("저장된 약", "Saved meds", "保存済みの薬", "已保存药品"),
  combosSaved: ml("저장된 꿀조합", "Saved combos", "保存済み組み合わせ", "已保存搭配"),
  exportTitle: ml("상담용 요약", "Consultation brief", "相談用サマリー", "咨询摘要"),
  exportBody: ml(
    "기기에 저장된 약 이름, 꿀조합, 오늘 루틴을 텍스트 파일로 내보냅니다. 사진과 원문 증상은 포함하지 않습니다.",
    "Export saved medicine names, combos, and today's routine as a text file. Photos and raw symptoms are not included.",
    "保存済みの薬名・組み合わせ・今日のルーティンをテキストで書き出します。写真や症状原文は含めません。",
    "将已保存药名、搭配和今日流程导出为文本文件。不包含照片和原始症状。",
  ),
  exportCta: ml("요약 내보내기", "Export brief", "書き出す", "导出摘要"),
  exported: ml("상담용 요약 파일을 만들었어요.", "Consultation brief created.", "相談用サマリーを作成しました。", "已创建咨询摘要。"),
  reminderTitle: ml("점검 리마인더", "Check-in reminder", "チェックリマインダー", "检查提醒"),
  reminderBody: ml(
    "브라우저 알림을 보내지는 않고, 이 기기에 점검 선호 시간을 저장해 다음 방문 때 이어서 보여줍니다.",
    "No push notification is sent; this device stores your preferred check-in time and shows it on return.",
    "プッシュ通知は送らず、この端末に希望時間を保存して次回表示します。",
    "不会发送推送通知；仅在本机保存检查偏好时间，下次访问时显示。",
  ),
  reminderDaily: ml("매일", "Daily", "毎日", "每天"),
  reminderWeekly: ml("매주", "Weekly", "毎週", "每周"),
  reminderSave: ml("리마인더 저장", "Save reminder", "保存", "保存提醒"),
  reminderSaved: ml("저장됨", "Saved", "保存済み", "已保存"),
  premiumTitle: ml("Plus가 팔아야 할 것", "What Plus should sell", "Plusが売るべき価値", "Plus 应销售的价值"),
  premiumBody: ml(
    "진단이 아니라 내 건강 메모를 잃어버리지 않게 해주는 개인 보관함과 상담 준비 기능입니다.",
    "Not diagnosis. Plus should sell a private health notebook and consultation prep that users do not want to lose.",
    "診断ではなく、失いたくない個人健康ノートと相談準備です。",
    "不是诊断，而是不想丢失的个人健康笔记和咨询准备。",
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
  ml("처방전·약봉투 사진을 약 목록으로 빠르게 정리", "Turn prescription and med-bag photos into a reusable med list", "処方箋・薬袋写真を薬リストに整理", "把处方和药袋照片整理成药品列表"),
  ml("비타민·편의점 꿀조합 보관함과 쇼핑 메모", "Vitamin/taste combo vault and shopping memo", "サプリ・味組み合わせ保管庫と買い物メモ", "维生素/口味搭配库和购物备忘"),
  ml("상담 전 요약 파일과 확인 질문 자동 구성", "Create a consultation brief with questions to verify", "相談前要約と確認質問を作成", "生成咨询摘要和确认问题"),
  ml("가족·보호자별 약 목록과 주간 점검 리포트", "Family med lists and weekly check-in reports", "家族別薬リストと週次レポート", "家庭药品列表和每周报告"),
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
    key: "combo",
    target: "vitamin",
    label: ml("꿀조합 저장", "Save a combo", "組み合わせ保存", "保存搭配"),
    value: ml("쇼핑·루틴으로 재사용", "Reuse for shopping/routine", "買い物・習慣に再利用", "用于购物/流程"),
    icon: "combo",
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

function iconFor(item: RoutineItem, className: string) {
  if (item.icon === "pill") return <PillIcon className={className} />;
  if (item.icon === "combo") return <StarIcon className={className} />;
  if (item.icon === "search") return <SearchIcon className={className} />;
  if (item.icon === "shield") return <ShieldCheckIcon className={className} />;
  return <HistoryIcon className={className} />;
}

function streakFrom(data: RoutineProgressByDate): number {
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
  const [doneByDate, setDoneByDate] = useState<RoutineProgressByDate>(() => loadRoutineProgress(uid));
  const [exported, setExported] = useState(false);
  const [plusInterest, setPlusInterest] = useState(() => loadPlusInterest(uid).interested);
  const [reminder, setReminder] = useState(() => loadRoutineReminder(uid));
  const [reminderSaved, setReminderSaved] = useState(false);
  const today = todayKey();
  const done = doneByDate[today] ?? [];
  const meds = useMemo(() => loadMeds(uid), [uid]);
  const savedCombos = useMemo(() => loadSavedCombos(uid), [uid]);
  const progress = Math.round((done.length / ROUTINE.length) * 100);
  const streak = streakFrom(doneByDate);

  function markAndGo(item: RoutineItem) {
    setDoneByDate((cur) => {
      const todayDone = new Set(cur[today] ?? []);
      todayDone.add(item.key);
      const next = { ...cur, [today]: Array.from(todayDone) };
      saveRoutineProgress(uid, next);
      return next;
    });
    onGo(item.target);
  }

  function exportBrief() {
    const text = buildConsultationBrief({
      date: today,
      meds,
      combos: savedCombos,
      routine: ROUTINE.map((item) => ({ label: item.label[lang], done: done.includes(item.key) })),
      disclaimer: COPY.disclaimer[lang],
    });
    downloadText(`mediq-consult-brief-${today}.txt`, text);
    setExported(true);
  }

  function registerPlusInterest() {
    setPlusInterest(savePlusInterest(uid).interested);
  }

  function saveReminder() {
    setReminder(saveRoutineReminder(uid, reminder));
    setReminderSaved(true);
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
          <div className="grid min-w-[220px] grid-cols-4 gap-2 rounded-2xl border border-line bg-surface-soft p-2 text-center">
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
            <div className="rounded-xl bg-surface px-2 py-3">
              <p className="text-[18px] font-black text-ink">{savedCombos.length}</p>
              <p className="mt-1 text-[10.5px] font-bold text-ink-4">{COPY.combosSaved[lang]}</p>
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
            onClick={registerPlusInterest}
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
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-[13px] font-extrabold text-ink">{COPY.reminderTitle[lang]}</h4>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">{COPY.reminderBody[lang]}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={reminder.enabled}
                onChange={(event) => setReminder((prev) => ({ ...prev, enabled: event.target.checked }))}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-ink-2 transition peer-checked:bg-brand" />
              <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
            </label>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select
              value={reminder.frequency}
              onChange={(event) => setReminder((prev) => ({ ...prev, frequency: event.target.value as RoutineReminderFrequency }))}
              className="h-10 rounded-xl border border-line bg-surface-soft px-3 text-[12.5px] font-bold text-ink outline-none focus:border-brand"
            >
              <option value="daily">{COPY.reminderDaily[lang]}</option>
              <option value="weekly">{COPY.reminderWeekly[lang]}</option>
            </select>
            <input
              type="time"
              value={reminder.time}
              onChange={(event) => setReminder((prev) => ({ ...prev, time: event.target.value }))}
              className="h-10 rounded-xl border border-line bg-surface-soft px-3 text-[12.5px] font-bold text-ink outline-none focus:border-brand"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveReminder}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-surface-soft px-4 text-[12.5px] font-extrabold text-ink-2 transition hover:border-brand-tint-2 hover:text-brand active:scale-[0.98]"
            >
              {COPY.reminderSave[lang]}
            </button>
            <span className="text-[11.5px] font-bold text-ink-4">{reminderSaved ? COPY.reminderSaved[lang] : reminderSummary(reminder, lang)}</span>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-4">{COPY.disclaimer[lang]}</p>
      </aside>
    </section>
  );
}

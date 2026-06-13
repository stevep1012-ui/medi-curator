"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { useI18n, type Lang } from "./i18n";
import { ACCENT, CARD, type MenuId } from "./Menu";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });

const HeartIcon: ReactNode = (
  <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5.5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7Z" />
);

type StepKey = "toPharmacy" | "consult" | "toInteraction" | "toVitamin" | "toSymptom" | "ai";
// target: a MenuId to navigate to, or "ai"
type Step = [StepKey, MenuId | "ai"];

const LABEL: Record<StepKey, ML> = {
  toPharmacy: ml("약국 찾기", "Find a pharmacy", "薬局を探す", "查找药房"),
  consult: ml("약사와 상담하기", "Consult a pharmacist", "薬剤師に相談", "咨询药师"),
  toInteraction: ml("복용 안전 검사", "Check drug safety", "服用の安全を確認", "用药安全检查"),
  toVitamin: ml("비타민 궁합 보기", "See vitamin pairing", "ビタミンの相性を見る", "查看维生素搭配"),
  toSymptom: ml("증상 분석하기", "Analyze symptoms", "症状を分析", "分析症状"),
  ai: ml("AI에게 더 물어보기", "Ask AI for more detail", "AIに詳しく聞く", "向AI了解更多"),
};
const TITLE = ml("이어서 하면 좋아요", "Helpful next steps", "次におすすめ", "建议的下一步");

const FLOW: Record<MenuId, Step[]> = {
  symptom: [["toPharmacy", "pharmacy"], ["toInteraction", "interaction"], ["ai", "ai"]],
  interaction: [["consult", "pharmacy"], ["toPharmacy", "pharmacy"], ["ai", "ai"]],
  vitamin: [["toInteraction", "interaction"], ["toPharmacy", "pharmacy"], ["ai", "ai"]],
  pharmacy: [["consult", "pharmacy"], ["toSymptom", "symptom"], ["ai", "ai"]],
  history: [["toSymptom", "symptom"], ["toVitamin", "vitamin"]],
  privacy: [],
};

const AICOPY: Record<Lang, { ph: string; ask: string; thinking: string; sys: string; noai: string; err: string; disc: string }> = {
  ko: {
    ph: "예: 이 약을 빈속에 먹어도 되나요?",
    ask: "질문하기",
    thinking: "답변을 작성하고 있어요…",
    sys: "당신은 친절한 한국어 건강 안내 도우미입니다. 일반의약품·영양제·생활 정보를 쉽고 간결하게 설명하되, 진단·처방은 하지 말고 필요하면 약사·의사 상담을 권하세요. 3~5문장으로 답하세요.",
    noai: "지금은 AI 응답을 사용할 수 없어요. 약사와 상담을 권해드려요.",
    err: "답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
    disc: "AI 안내는 참고용이며 의학적 진단이 아닙니다.",
  },
  en: {
    ph: "e.g., Can I take this on an empty stomach?",
    ask: "Ask",
    thinking: "Writing an answer…",
    sys: "You are a friendly health guide. Explain OTC meds, supplements and lifestyle tips simply and briefly. Do not diagnose or prescribe; suggest seeing a pharmacist or doctor when relevant. Answer in 3–5 sentences.",
    noai: "AI answers aren’t available right now. Please consult a pharmacist.",
    err: "Couldn’t get an answer. Please try again shortly.",
    disc: "AI guidance is for reference only, not a medical diagnosis.",
  },
  ja: {
    ph: "例：空腹で飲んでも大丈夫ですか？",
    ask: "質問する",
    thinking: "回答を作成中…",
    sys: "あなたは親切な健康ガイドです。市販薬・サプリ・生活情報を簡潔に説明し、診断や処方はせず、必要なら薬剤師や医師への相談を勧めてください。3〜5文で答えてください。",
    noai: "現在AI回答は利用できません。薬剤師にご相談ください。",
    err: "回答を取得できませんでした。しばらくして再試行してください。",
    disc: "AI案内は参考用であり医療診断ではありません。",
  },
  zh: {
    ph: "例如：可以空腹服用吗？",
    ask: "提问",
    thinking: "正在生成回答…",
    sys: "你是友好的健康向导。简洁解释非处方药、营养补充与生活建议；不要诊断或开处方，必要时建议咨询药师或医生。用3-5句话回答。",
    noai: "当前无法使用AI回答，请咨询药师。",
    err: "未能获取回答，请稍后重试。",
    disc: "AI指引仅供参考，并非医疗诊断。",
  },
};

declare global {
  interface Window {
    claude?: { complete: (prompt: string) => Promise<string> };
  }
}

export default function NextSteps({ active, onGo }: { active: MenuId; onGo: (id: MenuId) => void }) {
  const { lang } = useI18n();
  const [aiOpen, setAiOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const flow = FLOW[active];
  if (!flow || flow.length === 0) return null;
  const a = AICOPY[lang];

  const ask = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setAnswer(a.thinking);
    try {
      if (typeof window !== "undefined" && window.claude?.complete) {
        setAnswer(await window.claude.complete(a.sys + "\n\n" + q));
      } else {
        setAnswer(a.noai);
      }
    } catch {
      setAnswer(a.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-7 border-t border-line pt-6">
      <div className="mb-3.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
        <span className="h-1 w-5 rounded-full" style={{ background: "var(--tool, var(--brand))" }} />
        {TITLE[lang]}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {flow.map(([key, target], i) => {
          const isAI = target === "ai";
          const tone = isAI ? "var(--brand)" : ACCENT[target];
          return (
            <button
              key={i}
              onClick={() => (isAI ? setAiOpen((v) => !v) : onGo(target))}
              className="group/step flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ "--a": tone } as CSSProperties}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "color-mix(in srgb, var(--a) 13%, transparent)", color: "var(--a)" }}
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
                  {isAI ? HeartIcon : CARD[target].svg}
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

      {aiOpen && (
        <div className="mt-3 rounded-2xl border border-brand-tint-2 bg-brand-tint/60 p-3.5">
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
            }}
            placeholder={a.ph}
            className="w-full resize-y rounded-xl border border-line-2 bg-surface px-3.5 py-2.5 text-[13.5px] text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:ring-[3px] focus:ring-brand-tint"
          />
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] leading-snug text-ink-4">{a.disc}</p>
            <button
              onClick={ask}
              disabled={busy}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-brand px-4 text-[13px] font-bold text-white shadow-[0_10px_22px_-14px_rgba(11,110,97,0.9)] transition hover:bg-brand-2 disabled:opacity-60"
            >
              {a.ask}
            </button>
          </div>
          {answer && (
            <div className="mt-3 whitespace-pre-wrap rounded-xl border border-line bg-surface px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-2">
              {answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

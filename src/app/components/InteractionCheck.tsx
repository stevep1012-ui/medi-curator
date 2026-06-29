"use client";

import { useState } from "react";
import { InfoIcon, PillIcon, SearchIcon, ShieldCheckIcon } from "./icons";
import { useI18n, type Lang } from "./i18n";
import { runInteractionCheck, type CheckResult } from "./interactionRules";
import { getInteractionFromAI } from "../../services/aiToolsService";
import { addMed, medNamesText } from "../../services/medStore";
import MedCapture from "./MedCapture";
import type { InteractionAIResultT, RecognizedMedT } from "../../schemas/aiTools";

// AI-section labels kept local (small multilingual map) so the large Dict type in
// i18n.tsx stays untouched — same pattern as VitaminPairing's `ml()`.
type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });
const AI_T = {
  sectionTitle: ml("AI 추가 점검", "AI extended check", "AIによる追加チェック", "AI 额外检查"),
  badge: ml("AI 판단", "AI", "AI判断", "AI 判断"),
  loading: ml("AI가 입력 내용을 분석 중…", "AI is analyzing your input…", "AIが入力内容を分析中…", "AI 正在分析输入…"),
  none: ml(
    "입력하신 항목에서 추가로 확인할 상호작용 주제를 찾지 못했어요.",
    "No additional interaction topics were found for your input.",
    "入力項目で追加の相互作用トピックは見つかりませんでした。",
    "未在您的输入中发现额外的相互作用主题。",
  ),
  errorRetry: ml("다시 시도", "Retry", "再試行", "重试"),
  scanSaved: ml("내 목록에 저장했어요. 다음에도 자동으로 불러옵니다.", "Saved to My meds. It will be loaded next time.", "リストに保存しました。次回も自動で読み込みます。", "已保存到我的药品。下次会自动载入。"),
  saveScan: ml("내 목록에 저장", "Save to my list", "リストに保存", "保存到我的列表"),
} as const;

export default function InteractionCheck({ uid }: { uid?: string }) {
  const { t, lang } = useI18n();
  const x = t.interaction;

  const [query, setQuery] = useState(x.queryVal);
  const [current, setCurrent] = useState(() => medNamesText(uid) || x.currentVal);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [scanDraft, setScanDraft] = useState<RecognizedMedT | null>(null);
  const [scanSaved, setScanSaved] = useState(false);

  // Hybrid: deterministic rules give an instant safety net; the AI pass covers any
  // free-text the predefined matrix can't match.
  const [ai, setAi] = useState<InteractionAIResultT | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function runAi(q: string, c: string) {
    setAiLoading(true);
    setAiError(null);
    setAi(null);
    try {
      setAi(await getInteractionFromAI(q, c, false, lang));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "요청에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  function onCheck() {
    const q = query.trim();
    const c = current.trim();
    if (!q || !c) return;
    setResult(runInteractionCheck(q, c));
    void runAi(q, c);
  }

  // Camera recognition fills the "current" field with the scanned product name.
  function appendCurrent(rec: RecognizedMedT) {
    if (!rec.recognized || !rec.name) return;
    setScanDraft(rec);
    setScanSaved(false);
    setCurrent((cur) => (cur.trim() ? `${cur.trim()}, ${rec.name}` : rec.name));
  }

  function saveScanDraft() {
    if (!scanDraft?.recognized) return;
    addMed(uid, scanDraft);
    setScanSaved(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
        <p className="text-[12.5px] leading-snug text-ink-2">{x.disclaimer}</p>
      </div>

      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-5">
          <label className="space-y-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
              <SearchIcon className="h-3.5 w-3.5 text-ink-3" />
              {x.queryLabel}
            </span>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={x.queryPh}
              rows={2}
              className="w-full resize-y rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
            />
          </label>

          <label className="space-y-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
              <PillIcon className="h-3.5 w-3.5 text-ink-3" />
              {x.currentLabel}
            </span>
            <textarea
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder={x.currentPh}
              rows={3}
              className="w-full resize-y rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
            />
            <MedCapture lang={lang} onRecognized={appendCurrent} compact />
            {scanDraft?.recognized && (
              <div className="rounded-xl border border-brand-tint-2 bg-brand-tint/40 px-3 py-2 text-[12.5px] leading-snug text-ink-2">
                <div className="mb-2 font-bold text-ink">{scanDraft.name}</div>
                {scanSaved ? (
                  <p>{AI_T.scanSaved[lang]}</p>
                ) : (
                  <button
                    type="button"
                    onClick={saveScanDraft}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-brand px-3 text-[12px] font-bold text-white transition hover:bg-brand-2"
                  >
                    {AI_T.saveScan[lang]}
                  </button>
                )}
              </div>
            )}
          </label>

          <button
            type="button"
            onClick={onCheck}
            disabled={!query.trim() || !current.trim() || aiLoading}
            className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(11,110,97,0.85)] transition hover:bg-brand-2 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink-4 disabled:shadow-none disabled:hover:translate-y-0"
          >
            <ShieldCheckIcon className="h-[18px] w-[18px]" />
            {x.checkBtn}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-3.5">
          <h2 className="text-[15px] font-bold tracking-tight text-ink">{x.findingsTitle}</h2>

          {/* Non-judgmental notice — the tool no longer renders a danger/caution/safe
              verdict (RT-005: avoid personalized medical judgment). It only surfaces
              topics to confirm with a pharmacist. */}
          <div className="flex items-start gap-3 rounded-[16px] border border-line bg-surface px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink-3">
              <InfoIcon className="h-[18px] w-[18px]" />
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-2">{x.notice}</p>
          </div>

          {result.findings.length === 0 ? (
            <section className="rounded-[18px] border border-line bg-surface p-5 shadow-sm">
              <h3 className="mb-3.5 flex items-center gap-2.5 text-[14px] font-bold tracking-tight text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-soft text-ink-3">
                  <InfoIcon className="h-[15px] w-[15px]" />
                </span>
                {x.safeTitle}
              </h3>
              <p className="text-[13.5px] leading-relaxed text-ink-2">{x.safeDetail}</p>
            </section>
          ) : (
            result.findings.map((f) => {
              const r = x.rules[f.id];
              return (
                <section key={f.id} className="rounded-[16px] border border-line bg-surface p-4 shadow-sm sm:px-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full bg-ink-4" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[14.5px] font-bold text-ink">{r[0]}</h4>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-soft px-2 py-[2px] text-[10.5px] font-extrabold text-ink-3">
                          {x.askPharmacist}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r[1]}</p>
                    </div>
                  </div>
                </section>
              );
            })
          )}

          {/* AI extended check — covers free-text beyond the predefined rule matrix. */}
          <section className="rounded-[18px] border border-brand-tint-2 bg-brand-tint/40 p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2.5 text-[14px] font-bold tracking-tight text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
                <ShieldCheckIcon className="h-[15px] w-[15px]" />
              </span>
              {AI_T.sectionTitle[lang]}
              <span className="rounded-full bg-brand px-2 py-[2px] text-[10px] font-extrabold text-white">
                {AI_T.badge[lang]}
              </span>
            </h3>

            {aiLoading && (
              <p className="flex items-center gap-2 text-[13.5px] leading-relaxed text-ink-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                {AI_T.loading[lang]}
              </p>
            )}

            {aiError && !aiLoading && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[13px] leading-relaxed text-danger">{aiError}</p>
                <button
                  type="button"
                  onClick={() => void runAi(query.trim(), current.trim())}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-bold text-ink-2 transition hover:border-brand hover:text-brand"
                >
                  {AI_T.errorRetry[lang]}
                </button>
              </div>
            )}

            {ai && !aiLoading && !aiError && (
              <div className="space-y-3">
                {ai.topics.length === 0 ? (
                  <p className="text-[13.5px] leading-relaxed text-ink-2">{ai.generalNote || AI_T.none[lang]}</p>
                ) : (
                  <>
                    {ai.topics.map((tp, i) => (
                      <div key={i} className="rounded-[14px] border border-line bg-surface p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-[14px] font-bold text-ink">{tp.pair}</h4>
                          <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-soft px-2 py-[2px] text-[10.5px] font-extrabold text-ink-3">
                            {x.askPharmacist}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{tp.topic}</p>
                      </div>
                    ))}
                    {ai.generalNote && (
                      <p className="text-[12.5px] leading-relaxed text-ink-3">{ai.generalNote}</p>
                    )}
                  </>
                )}
                <p className="text-[11.5px] leading-relaxed text-ink-4">{ai.disclaimer}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

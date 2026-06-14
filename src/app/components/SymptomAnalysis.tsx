"use client";

import { useMemo, useState } from "react";
import {
  AlertIcon,
  InfoIcon,
  PillIcon,
  PulseIcon,
  SearchIcon,
  ShieldIcon,
} from "./icons";
import { useI18n } from "./i18n";
import { getCurationFromGemini } from "../../services/geminiService";
import { detectEmergency, HOTLINES } from "../../lib/emergency";
import type { CurationResult } from "../../types";

// Emergency crisis surface (AGENTS.md R-005): self-harm/suicide must lead with
// 109/1577-0199, not just 119. Detected on BOTH the live input (instant, no
// network/auth needed) and the server result department.
const MENTAL_DEPT = "정신건강의학과";
const PHYSICAL_DEPT = "응급의학과";

export default function SymptomAnalysis() {
  const { t } = useI18n();
  const s = t.symptom;

  const [symptoms, setSymptoms] = useState(s.symptomsVal);
  const [currentMedication, setCurrentMedication] = useState(s.medsVal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CurationResult | null>(null);

  const isAnalyzeDisabled = useMemo(
    () => loading || (!symptoms.trim() && !currentMedication.trim()),
    [loading, symptoms, currentMedication]
  );

  async function runAnalysis() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await getCurationFromGemini(
        symptoms.trim(),
        currentMedication.trim(),
        false,
        "ko"
      );
      setResult(data);
    } catch (e) {
      // Service maps auth/transport/forbidden errors to friendly Korean messages.
      setError(e instanceof Error ? e.message : "분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  const isCrisis =
    result != null &&
    (result.recommendedDepartment === MENTAL_DEPT ||
      result.recommendedDepartment === PHYSICAL_DEPT);
  const isMentalCrisis = result?.recommendedDepartment === MENTAL_DEPT;

  // Instant client-side crisis detection — fires as the user types, before any
  // network/auth, so a person in crisis always sees the hotline immediately.
  const instantEmergency = detectEmergency(symptoms);

  return (
    <>
      {instantEmergency && (
        <section
          role="alert"
          className="mb-6 rounded-[18px] border border-danger/40 bg-danger-tint p-5 shadow-sm"
        >
          <h2 className="mb-2 flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-danger">
            <ShieldIcon className="h-[17px] w-[17px]" />
            지금은 즉시 도움을 받는 것이 우선입니다
          </h2>
          <p className="mb-3 text-[13px] leading-relaxed text-ink-2">
            {instantEmergency === "mental"
              ? "혼자 견디지 마세요. 24시간 전문 상담을 받을 수 있어요."
              : "응급 징후가 의심됩니다. 지금 바로 119 또는 응급실을 이용하세요."}
          </p>
          <div className="flex flex-wrap gap-2">
            {HOTLINES[instantEmergency].map((h) => (
              <CrisisCall key={h.tel} tel={h.tel} label={h.label} aria={h.aria} />
            ))}
          </div>
        </section>
      )}

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <InfoIcon className="h-[18px] w-[18px] shrink-0 text-brand" />
        <p className="text-[12.5px] leading-snug text-ink-2">{s.disclaimer}</p>
      </div>

      <div className="rounded-[22px] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-5">
          <label className="space-y-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
              <PulseIcon className="h-3.5 w-3.5 text-ink-3" />
              {s.symptomsLabel}
            </span>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={s.symptomsPh}
              rows={4}
              className="w-full resize-y rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
            />
          </label>

          <label className="space-y-2.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
              <PillIcon className="h-3.5 w-3.5 text-ink-3" />
              {s.medsLabel}
            </span>
            <textarea
              value={currentMedication}
              onChange={(e) => setCurrentMedication(e.target.value)}
              placeholder={s.medsPh}
              rows={3}
              className="w-full resize-y rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-ink-4 focus:border-brand focus:bg-surface focus:ring-[3px] focus:ring-brand-tint"
            />
          </label>

          <button
            type="button"
            onClick={runAnalysis}
            disabled={isAnalyzeDisabled}
            aria-busy={loading}
            className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(11,110,97,0.85)] transition hover:bg-brand-2 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink-4 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                분석 중…
              </>
            ) : (
              <>
                <SearchIcon className="h-[18px] w-[18px]" />
                {s.analyze}
              </>
            )}
          </button>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-tint px-4 py-3 text-[13.5px] font-medium leading-snug text-danger"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {result && (
        <article className="mt-6 space-y-4 sm:mt-8" aria-live="polite">
          {isCrisis && (
            <section
              role="alert"
              className="rounded-[18px] border border-danger/40 bg-danger-tint p-5 shadow-sm"
            >
              <h3 className="mb-2 flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-danger">
                <ShieldIcon className="h-[17px] w-[17px]" />
                지금은 즉시 도움을 받는 것이 우선입니다
              </h3>
              <p className="mb-3 text-[13.5px] leading-relaxed text-ink-2">{result.aiAdvice}</p>
              <div className="flex flex-wrap gap-2">
                {isMentalCrisis && (
                  <>
                    <CrisisCall tel="109" label="자살예방 상담 109" />
                    <CrisisCall tel="1577-0199" label="정신건강 위기상담 1577-0199" />
                  </>
                )}
                <CrisisCall tel="119" label="응급 119" />
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">{s.resultsOverview}</h2>
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-soft px-3 text-[12px] font-bold text-ink-3 ring-1 ring-line">
              {s.educationalSummary}
            </span>
          </div>

          <ResultBlock title="권장 진료과" tone="brand" icon={<InfoIcon className="h-[15px] w-[15px]" />}>
            <p className="text-[13.5px] leading-relaxed text-ink-2">{result.recommendedDepartment}</p>
          </ResultBlock>

          {!isCrisis && (
            <ResultBlock title="안내" tone="brand" icon={<PulseIcon className="h-[15px] w-[15px]" />}>
              <p className="text-[13.5px] leading-relaxed text-ink-2">{result.aiAdvice}</p>
            </ResultBlock>
          )}

          {result.redFlags.length > 0 && (
            <ResultBlock title={s.redFlagTitle} tone="danger" icon={<ShieldIcon className="h-[15px] w-[15px]" />}>
              <ul className="space-y-2.5 text-[13.5px] leading-snug text-ink-2">
                {result.redFlags.map((flag) => (
                  <li key={flag} className="flex gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    {flag}
                  </li>
                ))}
              </ul>
            </ResultBlock>
          )}

          <p className="px-1 text-[12px] leading-snug text-ink-3">{result.disclaimer}</p>
        </article>
      )}
    </>
  );
}

function CrisisCall({ tel, label, aria }: { tel: string; label: string; aria?: string }) {
  return (
    <a
      href={`tel:${tel}`}
      aria-label={aria ?? label}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-danger px-4 text-[13px] font-bold text-white shadow-sm transition hover:opacity-90"
    >
      <AlertIcon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

type ResultBlockProps = {
  title: string;
  tone?: "brand" | "warn" | "danger";
  icon?: React.ReactNode;
  children: React.ReactNode;
};

const toneMap = {
  brand: "bg-brand-tint text-brand",
  warn: "bg-warn-tint text-warn",
  danger: "bg-danger-tint text-danger",
} as const;

function ResultBlock({ title, tone = "brand", icon, children }: ResultBlockProps) {
  return (
    <section className="rounded-[18px] border border-line bg-surface p-5 shadow-sm">
      <h3 className="mb-3.5 flex items-center gap-2.5 text-[14px] font-bold tracking-tight text-ink">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneMap[tone]}`}>{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

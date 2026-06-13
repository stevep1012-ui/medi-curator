"use client";

import { useMemo, useState } from "react";
import {
  AlertIcon,
  HeartIcon,
  InfoIcon,
  LeafIcon,
  PillIcon,
  PinIcon,
  PulseIcon,
  SearchIcon,
  ShieldIcon,
} from "./icons";
import { useI18n } from "./i18n";

export default function SymptomAnalysis({ onGoPharmacy }: { onGoPharmacy?: () => void }) {
  const { t } = useI18n();
  const s = t.symptom;

  const [symptoms, setSymptoms] = useState(s.symptomsVal);
  const [currentMedication, setCurrentMedication] = useState(s.medsVal);
  const [showResult, setShowResult] = useState(false);

  const isAnalyzeDisabled = useMemo(
    () => !symptoms.trim() && !currentMedication.trim(),
    [symptoms, currentMedication]
  );

  return (
    <>
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
            onClick={() => setShowResult(true)}
            disabled={isAnalyzeDisabled}
            className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-bold text-white shadow-[0_14px_26px_-16px_rgba(11,110,97,0.85)] transition hover:bg-brand-2 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink-4 disabled:shadow-none disabled:hover:translate-y-0"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
            {s.analyze}
          </button>
        </div>
      </div>

      {showResult && (
        <article className="mt-6 space-y-4 sm:mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold tracking-tight text-ink">{s.resultsOverview}</h2>
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-soft px-3 text-[12px] font-bold text-ink-3 ring-1 ring-line">
              {s.educationalSummary}
            </span>
          </div>

          <ResultBlock title={s.otcTitle} tone="brand" icon={<PillIcon className="h-[15px] w-[15px]" />}>
            <ul className="space-y-2.5 text-[13.5px] leading-snug text-ink-2">
              {s.otc.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-bright" />
                  {item}
                </li>
              ))}
            </ul>
          </ResultBlock>

          <ResultBlock title={s.interactionTitle} tone="warn" icon={<AlertIcon className="h-[15px] w-[15px]" />}>
            <p className="text-[13.5px] leading-relaxed text-ink-2">{s.interaction}</p>
          </ResultBlock>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ResultBlock title={s.exerciseTitle} tone="brand" icon={<HeartIcon className="h-[15px] w-[15px]" />}>
              <p className="text-[13.5px] leading-relaxed text-ink-2">{s.exercise}</p>
            </ResultBlock>

            <ResultBlock title={s.herbalTitle} tone="brand" icon={<LeafIcon className="h-[15px] w-[15px]" />}>
              <ul className="space-y-2.5 text-[13.5px] leading-snug text-ink-2">
                {s.herbal.map((tip) => (
                  <li key={tip} className="flex gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-bright" />
                    {tip}
                  </li>
                ))}
              </ul>
            </ResultBlock>
          </div>

          <ResultBlock title={s.redFlagTitle} tone="danger" icon={<ShieldIcon className="h-[15px] w-[15px]" />}>
            <ul className="space-y-2.5 text-[13.5px] leading-snug text-ink-2">
              {s.redFlags.map((flag) => (
                <li key={flag} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  {flag}
                </li>
              ))}
            </ul>
          </ResultBlock>

          <button
            type="button"
            onClick={onGoPharmacy}
            className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-brand-tint-2 bg-brand-tint text-[14.5px] font-bold text-brand transition hover:bg-brand hover:text-white"
          >
            <PinIcon className="h-[18px] w-[18px]" />
            {s.findPharmacy}
            <span className="text-[18px] leading-none">→</span>
          </button>
        </article>
      )}
    </>
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

import { useState } from 'react';
import {
  Stethoscope, MessageCircle, Pill, Leaf, Salad, Dumbbell,
  Clock, AlertTriangle, Copy, Check, Sparkles,
} from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';
import type { CurationResult as CurationResultType, OTCMedication } from '../types';

interface Props {
  result: CurationResultType;
  isProMode: boolean;
}

function RiskBadge({ level, t }: { level: OTCMedication['riskLevel']; t: Record<string, string> }) {
  const styles = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };
  const labels = { low: t.low, medium: t.medium, high: t.high };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export default function CurationResult({ result, isProMode }: Props) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Pro Mode Badge */}
      {isProMode && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800 rounded-xl w-fit">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t.proModeResult}</span>
        </div>
      )}

      {/* Red Flags */}
      {result.redFlags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">{t.redFlags}</h3>
          </div>
          <ul className="space-y-2">
            {result.redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-600 dark:text-red-300 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Department */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.recommendedDepartment}</h3>
        </div>
        <span className="inline-block px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl text-sm font-semibold">
          {result.recommendedDepartment}
        </span>
      </div>

      {/* AI Advice */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.aiAdvice}</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {result.aiAdvice}
        </p>
      </div>

      {/* OTC Medications */}
      {result.otcMedications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.otcMedications}</h3>
          </div>
          <div className="space-y-3">
            {result.otcMedications.map((med, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{med.name}</span>
                  <RiskBadge level={med.riskLevel} t={t as unknown as Record<string, string>} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{t.purpose}:</span> {med.purpose}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{t.dosage}:</span> {med.dosage}
                </p>
                {med.warnings.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{t.warnings}:</span>
                    <ul className="mt-1 space-y-0.5">
                      {med.warnings.map((w, j) => (
                        <li key={j} className="text-xs text-orange-600 dark:text-orange-400 pl-3">- {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {med.interactions && med.interactions.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">{t.interactions}:</span>
                    <ul className="mt-1 space-y-0.5">
                      {med.interactions.map((inter, j) => (
                        <li key={j} className="text-xs text-red-600 dark:text-red-400 pl-3">- {inter}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">
            * 처방전 불필요 일반의약품 (OTC)
          </p>
        </div>
      )}

      {/* Folk Remedies */}
      {result.folkRemedies.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.folkRemedies}</h3>
          </div>
          <ul className="space-y-2">
            {result.folkRemedies.map((r, i) => (
              <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lifestyle Tips */}
      {result.lifestyleTips.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Salad className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.lifestyleTips}</h3>
          </div>
          <ul className="space-y-2">
            {result.lifestyleTips.map((tip, i) => (
              <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exercise Prescription */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Dumbbell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.exercisePrescription}</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">{t.recommendedExercise}</p>
            <ul className="space-y-1">
              {result.exercisePrescription.recommended.map((ex, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-300">+ {ex}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">{t.avoidExercise}</p>
            <ul className="space-y-1">
              {result.exercisePrescription.avoid.map((ex, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-300">- {ex}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">{t.duration}:</span> {result.exercisePrescription.duration}
        </p>
      </div>

      {/* Recovery Timeline */}
      {result.recoveryTimeline.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.recoveryTimeline}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{t.ageGroup}</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{t.expectedDays}</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{t.notes}</th>
                </tr>
              </thead>
              <tbody>
                {result.recoveryTimeline.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <td className="py-2 text-slate-700 dark:text-slate-200 font-medium">{row.ageGroup}</td>
                    <td className="py-2 text-slate-600 dark:text-slate-300">{row.expectedDays}</td>
                    <td className="py-2 text-slate-500 dark:text-slate-400 text-xs">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Copy & Disclaimer */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t.copied : t.copy}
        </button>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed text-center">
        {result.disclaimer}
      </p>
    </div>
  );
}

// Canonical symptom input with CLIENT-SIDE emergency detection (AGENTS.md R-005).
// As the user types, self-harm/suicide keywords surface 109 + 1577-0199 (never
// just 119); physical-emergency keywords surface 119. This is an instant safety
// layer that does not wait for a server round-trip.
import { useRef, useState } from 'react';
import { useLanguage } from '../contexts/useLanguage';

// SpeechRecognition is a non-standard Web API not in TypeScript's DOM lib, so we
// declare the minimal surface we use.
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface VoiceRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type VoiceRecognitionCtor = new () => VoiceRecognition;

declare global {
  interface Window {
    SpeechRecognition?: VoiceRecognitionCtor;
    webkitSpeechRecognition?: VoiceRecognitionCtor;
  }
}

const MENTAL_KEYWORDS = [
  '죽고 싶', '자살', '자해', '살고 싶지 않', '극단적 선택',
  'suicide', 'self-harm', 'kill myself',
];
const PHYSICAL_KEYWORDS = [
  '흉통', '가슴통증', '호흡곤란', '숨을 못 쉬', '의식잃', '의식불명',
  '반신마비', '안면마비', '극심한 두통', '갑작스러운 두통', '토혈', '혈변', '대량출혈',
  'chest pain', 'cannot breathe', 'unconscious', 'stroke', 'heart attack',
];

function detectEmergency(text: string): 'mental' | 'physical' | null {
  const lower = text.toLowerCase();
  if (MENTAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return 'mental';
  if (PHYSICAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return 'physical';
  return null;
}

interface SymptomInputProps {
  onAnalyze: (symptoms: string, medication: string) => void;
  isLoading: boolean;
}

export default function SymptomInput({ onAnalyze, isLoading }: SymptomInputProps) {
  const { t } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [medication, setMedication] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  const emergency = detectEmergency(symptoms);
  const canSubmit = !isLoading && symptoms.trim().length >= 3;

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;

  function submit() {
    if (!canSubmit) return;
    onAnalyze(symptoms.trim(), medication.trim());
  }

  function toggleVoice() {
    if (!SpeechRecognitionCtor) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognitionCtor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'ko-KR';
    rec.onresult = (e: SpeechResultEvent) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) setSymptoms((cur) => (cur ? `${cur} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div className="space-y-4">
      {emergency === 'mental' && (
        <div role="alert" className="rounded-xl border border-danger-line bg-danger-tint p-4">
          <p className="mb-2 text-sm font-bold text-danger">{t.emergencyWarning}</p>
          <div className="flex flex-wrap gap-2">
            <a href="tel:109" aria-label="자살예방상담전화 109" className="rounded-full bg-danger px-4 py-2 text-[13px] font-bold text-white">
              자살예방 상담 109
            </a>
            <a href="tel:1577-0199" aria-label="정신건강위기상담 1577-0199" className="rounded-full bg-danger px-4 py-2 text-[13px] font-bold text-white">
              정신건강 위기상담 1577-0199
            </a>
          </div>
        </div>
      )}
      {emergency === 'physical' && (
        <div role="alert" className="rounded-xl border border-danger-line bg-danger-tint p-4">
          <p className="mb-2 text-sm font-bold text-danger">{t.emergencyWarning}</p>
          <a href="tel:119" aria-label="응급의료 119" className="rounded-full bg-danger px-4 py-2 text-[13px] font-bold text-white">
            응급의료 119
          </a>
        </div>
      )}

      <div className="relative">
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder={t.symptomPlaceholder}
          rows={4}
          disabled={isLoading}
          className="w-full resize-y rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm text-ink outline-none disabled:opacity-60"
        />
        {SpeechRecognitionCtor && (
          <button
            type="button"
            onClick={toggleVoice}
            title={listening ? t.voiceInputStop : t.voiceInputStart}
            aria-pressed={listening}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white"
          >
            🎤
          </button>
        )}
      </div>

      <input
        type="text"
        value={medication}
        onChange={(e) => setMedication(e.target.value)}
        placeholder={t.medicationPlaceholder}
        disabled={isLoading}
        className="w-full rounded-xl border border-line-2 bg-surface-soft px-4 py-3 text-sm text-ink outline-none disabled:opacity-60"
      />

      {symptoms.trim().length > 0 && symptoms.trim().length < 3 && (
        <p className="text-[12.5px] text-ink-3">{t.minChars}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:bg-ink-4"
      >
        {isLoading ? t.analyzing : t.analyzeButton}
      </button>
    </div>
  );
}

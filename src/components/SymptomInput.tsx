import { useState, useRef, useMemo } from 'react';
import { Mic, MicOff, Search, Loader2, AlertTriangle, Phone } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

// 응급 키워드 — medical-reviewer + legal-advisor 공동 관리.
// 신체 응급(119) vs 정신 응급(1393) 분리. 자살예방법 §13 준수.
const PHYSICAL_EMERGENCY = [
  '흉통', '가슴통증', '호흡곤란', '숨을 못 쉬', '의식잃', '의식불명',
  '마비', '반신마비', '안면마비', '극심한 두통', '갑작스러운 두통',
  '토혈', '혈변', '대량출혈',
  'chest pain', 'cannot breathe', 'unconscious', 'stroke', 'heart attack',
];
const MENTAL_EMERGENCY = [
  '자살', '자해', '죽고 싶', '살고 싶지 않', '극단적 선택',
  'suicide', 'self-harm', 'kill myself',
];
const EMERGENCY_KEYWORDS = [...PHYSICAL_EMERGENCY, ...MENTAL_EMERGENCY];

interface SymptomInputProps {
  onAnalyze: (symptoms: string, medications: string) => void;
  isLoading: boolean;
}

export default function SymptomInput({ onAnalyze, isLoading }: SymptomInputProps) {
  const { t } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // 응급 분류는 파생 상태 — useEffect+setState 대신 useMemo 로 매 렌더 계산
  const emergencyKind = useMemo<'physical' | 'mental' | null>(() => {
    const lower = symptoms.toLowerCase();
    if (MENTAL_EMERGENCY.some((kw) => lower.includes(kw.toLowerCase()))) return 'mental';
    if (PHYSICAL_EMERGENCY.some((kw) => lower.includes(kw.toLowerCase()))) return 'physical';
    return null;
  }, [symptoms]);
  const showEmergency = emergencyKind !== null;
  void EMERGENCY_KEYWORDS; // 단일 매트릭스 유지용 참조

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSymptoms(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.trim().length >= 3 && !isLoading) {
      onAnalyze(symptoms.trim(), medications.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Emergency Banner */}
      {showEmergency && (
        <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-400 dark:border-red-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-300 font-semibold text-sm">
              {t.emergencyWarning}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {emergencyKind === 'mental' ? (
              <>
                <a
                  href="tel:1393"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors"
                  aria-label="자살예방상담전화 1393"
                >
                  <Phone className="w-4 h-4" /> 1393
                </a>
                <a
                  href="tel:1577-0199"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors"
                  aria-label="정신건강위기상담 1577-0199"
                >
                  <Phone className="w-4 h-4" /> 1577-0199
                </a>
              </>
            ) : (
              <a
                href="tel:119"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors"
                aria-label="응급의료 119"
              >
                <Phone className="w-4 h-4" /> 119
              </a>
            )}
          </div>
        </div>
      )}

      {/* Symptoms Input */}
      <div className="relative">
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder={t.symptomPlaceholder}
          className="w-full min-h-[140px] p-4 pr-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y text-sm leading-relaxed transition-all"
          disabled={isLoading}
        />
        {/* Voice Button */}
        {speechSupported ? (
          <button
            type="button"
            onClick={toggleVoice}
            className={`absolute top-3 right-3 p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-300 dark:shadow-red-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900 dark:hover:text-teal-400'
            }`}
            title={isListening ? t.voiceInputStop : t.voiceInputStart}
            disabled={isLoading}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="absolute top-3 right-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
            title={t.voiceNotSupported}
          >
            <MicOff className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Medications Input */}
      <input
        type="text"
        value={medications}
        onChange={(e) => setMedications(e.target.value)}
        placeholder={t.medicationPlaceholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-all"
        disabled={isLoading}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={symptoms.trim().length < 3 || isLoading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-200 dark:shadow-teal-900/30"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.analyzing}
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            {t.analyzeButton}
          </>
        )}
      </button>

      {symptoms.length > 0 && symptoms.trim().length < 3 && (
        <p className="text-xs text-slate-400 text-center">{t.minChars}</p>
      )}
    </form>
  );
}

// Language dictionary hook for the canonical src/components/ layer.
// Kept as a plain hook module (no JSX/provider component) so it stays
// fast-refresh-clean. A LanguageProvider can be added in its own file when this
// layer is wired into the app shell; until then the hook returns Korean defaults.
export type Lang = 'ko' | 'en';

export interface Dict {
  symptomPlaceholder: string;
  medicationPlaceholder: string;
  analyzeButton: string;
  analyzing: string;
  minChars: string;
  voiceInputStart: string;
  voiceInputStop: string;
  voiceNotSupported: string;
  emergencyWarning: string;
}

const ko: Dict = {
  symptomPlaceholder: '현재 증상을 자세히 설명해주세요.',
  medicationPlaceholder: '예: 고혈압약 암로디핀, 당뇨약 메트포르민',
  analyzeButton: 'AI 건강 정보 분석',
  analyzing: '분석 중...',
  minChars: '3자 이상 입력해주세요.',
  voiceInputStart: '음성 입력 시작',
  voiceInputStop: '음성 입력 중지',
  voiceNotSupported: '이 브라우저는 음성 인식을 지원하지 않습니다.',
  emergencyWarning: '응급 상황입니다.',
};

const en: Dict = {
  symptomPlaceholder: 'Describe your current symptoms in detail.',
  medicationPlaceholder: 'e.g. amlodipine for hypertension, metformin for diabetes',
  analyzeButton: 'AI health info analysis',
  analyzing: 'Analyzing...',
  minChars: 'Enter at least 3 characters.',
  voiceInputStart: 'Start voice input',
  voiceInputStop: 'Stop voice input',
  voiceNotSupported: 'This browser does not support speech recognition.',
  emergencyWarning: 'This is an emergency.',
};

export const DICTS: Record<Lang, Dict> = { ko, en };

export interface LanguageValue {
  t: Dict;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export function useLanguage(): LanguageValue {
  return { t: ko, lang: 'ko', setLang: () => {} };
}

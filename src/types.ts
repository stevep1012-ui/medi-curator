// Shared client types for medi-curator.
// CurationResult mirrors the Cloud Function contract (functions/src/index.ts)
// and the Zod schema in src/schemas/curation.ts. Health content arrays are
// present in the type but are returned empty by the server (legal posture).

// 서버·스키마가 받아들이는 언어 코드의 정본. UI 는 번역 문자열이 있는 부분집합만
// 다루며(src/app/components/i18n.tsx 의 Lang), 'es' 는 아직 번역이 없어 화면에서
// 선택할 수 없다 — 서버만 이해하는 값이다.
export type Language = 'ko' | 'en' | 'zh' | 'ja' | 'es';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface OTCMedication {
  name: string;
  purpose: string;
  dosage: string;
  warnings: string[];
  interactions?: string[];
  riskLevel: RiskLevel;
}

export interface ExercisePlan {
  recommended: string[];
  avoid: string[];
  duration: string;
}

export interface RecoveryTimeline {
  ageGroup: string;
  expectedDays: string;
  notes: string;
}

export interface CurationResult {
  recommendedDepartment: string;
  aiAdvice: string;
  otcMedications: OTCMedication[];
  folkRemedies: string[];
  lifestyleTips: string[];
  exercisePrescription: ExercisePlan;
  recoveryTimeline: RecoveryTimeline[];
  redFlags: string[];
  disclaimer: string;
}

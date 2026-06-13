// Shared client types for medi-curator.
// CurationResult mirrors the Cloud Function contract (functions/src/index.ts)
// and the Zod schema in src/schemas/curation.ts. Health content arrays are
// present in the type but are returned empty by the server (legal posture).

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

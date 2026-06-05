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

export interface OTCMedication {
  name: string;
  purpose: string;
  dosage: string;
  warnings: string[];
  interactions?: string[];
  riskLevel: 'low' | 'medium' | 'high';
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

export interface SearchRecord {
  id: string;
  userId: string;
  symptoms: string;
  currentMedications: string;
  result: CurationResult;
  createdAt: Date;
  language: string;
}

export interface Pharmacy {
  placeId: string;
  name: string;
  address: string;
  distance: string;
  phone?: string;
  isOpen: boolean;
  rating?: number;
  reviewSummary?: string;
  location: { lat: number; lng: number };
}

export type Language = 'ko' | 'en' | 'zh' | 'ja' | 'es';
export type Theme = 'light' | 'dark' | 'auto';

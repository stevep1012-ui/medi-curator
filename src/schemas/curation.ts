// Client-side Zod schemas for the curation contract.
// MUST stay in sync with functions/src/index.ts (server validation).
// All LLM output is validated against CurationResult before it may reach the UI
// (AGENTS.md R-008: validation failure = never shown to the user).
import { z } from 'zod';

export const Language = z.enum(['ko', 'en', 'zh', 'ja', 'es']);
export const RiskLevel = z.enum(['low', 'medium', 'high']);

export const OTCMedication = z.object({
  name: z.string().min(1).max(120),
  purpose: z.string().min(1).max(500),
  dosage: z.string().min(1).max(500),
  warnings: z.array(z.string().max(500)).max(20),
  interactions: z.array(z.string().max(500)).max(20).optional(),
  riskLevel: RiskLevel,
});

export const ExercisePlan = z.object({
  recommended: z.array(z.string().max(300)).max(20),
  avoid: z.array(z.string().max(300)).max(20),
  duration: z.string().max(200),
});

export const RecoveryTimeline = z.object({
  ageGroup: z.string().max(100),
  expectedDays: z.string().max(100),
  notes: z.string().max(500),
});

export const CurationResult = z.object({
  recommendedDepartment: z.string().min(1).max(100),
  aiAdvice: z.string().min(1).max(2000),
  otcMedications: z.array(OTCMedication).max(10),
  folkRemedies: z.array(z.string().max(300)).max(10),
  lifestyleTips: z.array(z.string().max(300)).max(15),
  exercisePrescription: ExercisePlan,
  recoveryTimeline: z.array(RecoveryTimeline).max(6),
  redFlags: z.array(z.string().max(300)).max(15),
  // INV-1: disclaimer always required.
  // 상한이 서버 스키마(1000)보다 큰 이유 — 서버는 모델 출력을 1000자로 검증한 뒤
  // 비한국어 응답에 한국 법제 영문 고지를 덧붙여 보낸다(INV-5). 여기서도 1000 이면
  // 긴 응답이 검증에 걸려 사용자에게 "결과를 표시할 수 없습니다" 가 뜬다.
  disclaimer: z.string().min(10).max(1400),
});

export const SymptomQuery = z.object({
  symptoms: z.string().min(3).max(4096),
  currentMedications: z.string().max(2048).default(''),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
  age: z.string().max(20).optional(),
});

// 의료법 §27 / forbidden-phrases guard — reject diagnosis/prescription/cure claims.
// Mirror of the server FORBIDDEN set. Returns the matched phrase or null.
const FORBIDDEN: RegExp[] = [
  /진단(됩니다|입니다|이[다라])/,
  /처방(해드립니다|입니다|이[다라])/,
  /완치(됩니다|보장)/,
  /부작용 없[음이다는]/,
  /100% 효과/,
];

export function violatesForbidden(text: string): string | null {
  for (const re of FORBIDDEN) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

// medi-curator 공유 스키마 — 클라이언트(zod-infer)와 서버 프록시 양쪽에서 사용.
// types/index.ts 는 이 파일의 z.infer 로 대체될 예정 (frontend-architect 마이그레이션).
import { z } from 'zod';

export const Language = z.enum(['ko', 'en', 'zh', 'ja', 'es']);
export type Language = z.infer<typeof Language>;

export const RiskLevel = z.enum(['low', 'medium', 'high']);

export const OTCMedication = z.object({
  name: z.string().min(1).max(120),
  purpose: z.string().min(1).max(500),
  dosage: z.string().min(1).max(500),
  warnings: z.array(z.string().max(500)).max(20),
  interactions: z.array(z.string().max(500)).max(20).optional(),
  riskLevel: RiskLevel,
});
export type OTCMedication = z.infer<typeof OTCMedication>;

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
  disclaimer: z.string().min(10).max(1000), // INV-1: 비어있을 수 없음
});
export type CurationResult = z.infer<typeof CurationResult>;

export const SymptomQuery = z.object({
  symptoms: z.string().min(3).max(4096),
  currentMedications: z.string().max(2048).default(''),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
  age: z.string().max(20).optional(),
});
export type SymptomQuery = z.infer<typeof SymptomQuery>;

export const CurateRequest = SymptomQuery;
export const CurateResponse = z.union([
  z.object({ ok: z.literal(true), data: CurationResult, cached: z.boolean() }),
  z.object({ ok: z.literal(false), code: z.string(), message: z.string() }),
]);

// 금지어 검사 — forbidden-phrases.txt 의 부분집합 (런타임 가드).
// 전체 검사는 서버에서 파일 로드.
const QUICK_FORBIDDEN = [
  /진단(됩니다|입니다|이[다라])/,
  /처방(해드립니다|입니다|이[다라])/,
  /완치(됩니다|보장)/,
  /부작용 없[음이다는]/,
  /100% 효과/,
];

export function violatesForbidden(text: string): string | null {
  for (const re of QUICK_FORBIDDEN) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

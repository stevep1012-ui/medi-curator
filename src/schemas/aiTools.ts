// Client-side Zod schemas for the AI-assisted tool endpoints (interaction, pairing).
// MUST stay in sync with functions/src/aiTools.ts (server validation).
// All LLM output is validated against these before it may reach the UI
// (AGENTS.md R-008: validation failure = never shown to the user).
import { z } from 'zod';
import { Language } from './curation';

// ── 상호작용 점검 ──────────────────────────────────────────────────────────
export const InteractionQuery = z.object({
  query: z.string().min(1).max(2048),
  current: z.string().min(1).max(2048),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
});

export const InteractionTopic = z.object({
  pair: z.string().min(1).max(200),
  topic: z.string().min(1).max(500),
  severity: z.enum(['info', 'caution']),
});

export const InteractionAIResult = z.object({
  topics: z.array(InteractionTopic).max(12),
  generalNote: z.string().max(800),
  disclaimer: z.string().min(10).max(1000),
});

export type InteractionAIResultT = z.infer<typeof InteractionAIResult>;
export type InteractionTopicT = z.infer<typeof InteractionTopic>;

// ── 영양제 궁합 ────────────────────────────────────────────────────────────
export const PairingQuery = z.object({
  goal: z.string().min(1).max(500),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
});

export const PairingItem = z.object({
  name: z.string().min(1).max(120),
  why: z.string().min(1).max(300),
});

export const PairingAIResult = z.object({
  goalLabel: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  items: z.array(PairingItem).min(1).max(8),
  tip: z.string().max(400),
  disclaimer: z.string().min(10).max(1000),
});

export type PairingAIResultT = z.infer<typeof PairingAIResult>;
export type PairingItemT = z.infer<typeof PairingItem>;

// ── 복용약/비타민 사진 인식 ─────────────────────────────────────────────────
export const RecognizeQuery = z.object({
  imageBase64: z.string().min(16).max(7_000_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  language: Language.default('ko'),
  isProMode: z.boolean().default(false),
});

export const MedCategory = z.enum(['medicine', 'supplement', 'vitamin', 'unknown']);

export const RecognizedMed = z.object({
  recognized: z.boolean(),
  name: z.string().max(200),
  category: MedCategory,
  ingredients: z.array(z.string().max(200)).max(40),
  efficacy: z.string().max(1200),
  cautions: z.array(z.string().max(300)).max(15),
  disclaimer: z.string().min(10).max(1000),
});

export type RecognizedMedT = z.infer<typeof RecognizedMed>;
export type MedCategoryT = z.infer<typeof MedCategory>;

// 기기 로컬에 저장되는 '내 약·비타민' 레코드 (서버로 전송하지 않음, PIPA).
export const StoredMed = RecognizedMed.omit({ recognized: true }).extend({
  id: z.string(),
  addedAt: z.string(), // ISO 8601
  note: z.string().max(500).default(''),
});

export type StoredMedT = z.infer<typeof StoredMed>;

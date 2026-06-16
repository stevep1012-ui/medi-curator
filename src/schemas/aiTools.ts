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

// Shared client-side emergency detection (AGENTS.md R-005).
// Single source of truth for crisis keyword classification, mirroring the server
// (functions/src/index.ts). Used by the symptom inputs to surface crisis hotlines
// INSTANTLY as the user types — before (and independent of) any server round-trip,
// auth, or network. A person in crisis must always see 109/1577-0199 (mental) or
// 119 (physical), even when signed out or offline.

export type EmergencyKind = 'mental' | 'physical';

export const MENTAL_KEYWORDS = [
  '자살', '자해', '죽고 싶', '살고 싶지 않', '극단적 선택',
  'suicide', 'self-harm', 'kill myself',
];

export const PHYSICAL_KEYWORDS = [
  '흉통', '가슴통증', '호흡곤란', '숨을 못 쉬', '의식잃', '의식불명',
  '반신마비', '안면마비', '극심한 두통', '갑작스러운 두통', '토혈', '혈변', '대량출혈',
  'chest pain', 'cannot breathe', 'unconscious', 'stroke', 'heart attack',
];

// Korea crisis contacts. Mental crises lead with 109 + 1577-0199 (NOT just 119).
export const HOTLINES = {
  mental: [
    { tel: '109', label: '자살예방 상담 109', aria: '자살예방상담전화 109' },
    { tel: '1577-0199', label: '정신건강 위기상담 1577-0199', aria: '정신건강위기상담 1577-0199' },
  ],
  physical: [{ tel: '119', label: '응급의료 119', aria: '응급의료 119' }],
} as const;

export function detectEmergency(text: string): EmergencyKind | null {
  const lower = text.toLowerCase();
  if (MENTAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return 'mental';
  if (PHYSICAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) return 'physical';
  return null;
}

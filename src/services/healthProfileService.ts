import { z } from 'zod';

export const SelfReportedHealthProfile = z.object({
  conditionStatus: z.enum(['none', 'has', 'unknown']).default('unknown'),
  conditionsText: z.string().max(1000).default(''),
  allergiesText: z.string().max(1000).default(''),
  notes: z.string().max(1000).default(''),
  updatedAt: z.string().default(''),
});

export type SelfReportedHealthProfileT = z.infer<typeof SelfReportedHealthProfile>;

const DEFAULT_PROFILE: SelfReportedHealthProfileT = {
  conditionStatus: 'unknown',
  conditionsText: '',
  allergiesText: '',
  notes: '',
  updatedAt: '',
};

const keyFor = (uid: string | undefined) => `medi-curator:health-profile:${uid ?? 'local'}`;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function cleanText(value: string): string {
  return value.trim().slice(0, 1000);
}

export function loadHealthProfile(uid?: string): SelfReportedHealthProfileT {
  const s = storage();
  if (!s) return { ...DEFAULT_PROFILE };
  try {
    const parsed = SelfReportedHealthProfile.safeParse(JSON.parse(s.getItem(keyFor(uid)) || 'null'));
    return parsed.success ? parsed.data : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveHealthProfile(uid: string | undefined, input: Omit<SelfReportedHealthProfileT, 'updatedAt'>): SelfReportedHealthProfileT {
  const profile = SelfReportedHealthProfile.parse({
    conditionStatus: input.conditionStatus,
    conditionsText: cleanText(input.conditionsText),
    allergiesText: cleanText(input.allergiesText),
    notes: cleanText(input.notes),
    updatedAt: new Date().toISOString(),
  });
  const s = storage();
  if (s) s.setItem(keyFor(uid), JSON.stringify(profile));
  return profile;
}

export function clearHealthProfile(uid?: string): void {
  const s = storage();
  if (s) s.removeItem(keyFor(uid));
}

export type RoutineProgressKey = 'meds' | 'combo' | 'symptoms' | 'interaction' | 'pharmacy';

export type RoutineProgressByDate = Record<string, RoutineProgressKey[]>;

const keyFor = (uid: string | undefined) => `medi-curator:growth:${uid ?? 'local'}`;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isRoutineProgressKey(value: unknown): value is RoutineProgressKey {
  return value === 'meds' || value === 'combo' || value === 'symptoms' || value === 'interaction' || value === 'pharmacy';
}

export function loadRoutineProgress(uid?: string): RoutineProgressByDate {
  const s = storage();
  if (!s) return {};
  try {
    const parsed = JSON.parse(s.getItem(keyFor(uid)) || '{}') as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const entries: [string, RoutineProgressKey[]][] = [];
    for (const [date, value] of Object.entries(parsed)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(value)) continue;
      entries.push([date, Array.from(new Set(value.filter(isRoutineProgressKey)))]);
    }
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export function saveRoutineProgress(uid: string | undefined, data: RoutineProgressByDate): RoutineProgressByDate {
  const s = storage();
  if (s) s.setItem(keyFor(uid), JSON.stringify(data));
  return data;
}

export function clearRoutineProgress(uid?: string): void {
  const s = storage();
  if (s) s.removeItem(keyFor(uid));
}

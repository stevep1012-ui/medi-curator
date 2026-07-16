export type PlusInterest = {
  interested: boolean;
  savedAt: string;
};

const keyFor = (uid: string | undefined) => `medi-curator:plus-interest:${uid ?? 'local'}`;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadPlusInterest(uid?: string): PlusInterest {
  const s = storage();
  if (!s) return { interested: false, savedAt: '' };
  try {
    const parsed = JSON.parse(s.getItem(keyFor(uid)) || 'null') as Partial<PlusInterest> | null;
    if (!parsed || typeof parsed !== 'object') return { interested: false, savedAt: '' };
    return {
      interested: parsed.interested === true,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
    };
  } catch {
    return { interested: false, savedAt: '' };
  }
}

export function savePlusInterest(uid?: string): PlusInterest {
  const next: PlusInterest = {
    interested: true,
    savedAt: new Date().toISOString(),
  };
  const s = storage();
  if (s) s.setItem(keyFor(uid), JSON.stringify(next));
  return next;
}

export function clearPlusInterest(uid?: string): void {
  const s = storage();
  if (s) s.removeItem(keyFor(uid));
}

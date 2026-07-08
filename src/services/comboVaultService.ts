export type ComboVaultItem = {
  id: string;
  savedAt: string;
  title: string;
  category: string;
  summary: string;
  items: { name: string; why: string }[];
  tip: string;
  disclaimer: string;
};

export type ComboVaultInput = Omit<ComboVaultItem, 'id' | 'savedAt'>;

const KEY = 'medi-curator:combo-vault:v1';
const MAX_ITEMS = 30;

function safeParse(raw: string | null): ComboVaultItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ComboVaultItem =>
      item &&
      typeof item.id === 'string' &&
      typeof item.savedAt === 'string' &&
      typeof item.title === 'string' &&
      typeof item.category === 'string' &&
      typeof item.summary === 'string' &&
      Array.isArray(item.items) &&
      typeof item.tip === 'string' &&
      typeof item.disclaimer === 'string',
    );
  } catch {
    return [];
  }
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadSavedCombos(): ComboVaultItem[] {
  const s = storage();
  if (!s) return [];
  return safeParse(s.getItem(KEY));
}

export function saveCombo(input: ComboVaultInput): ComboVaultItem[] {
  const s = storage();
  if (!s) return [];
  const current = loadSavedCombos();
  const withoutDuplicate = current.filter((item) => item.title !== input.title);
  const next: ComboVaultItem[] = [
    {
      ...input,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
    },
    ...withoutDuplicate,
  ].slice(0, MAX_ITEMS);
  s.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteCombo(id: string): ComboVaultItem[] {
  const s = storage();
  if (!s) return [];
  const next = loadSavedCombos().filter((item) => item.id !== id);
  s.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearCombos(): ComboVaultItem[] {
  const s = storage();
  if (!s) return [];
  s.removeItem(KEY);
  return [];
}

export function exportCombosText(items: ComboVaultItem[], lang = 'ko'): string {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    lang === 'ko' ? 'MediQ 꿀조합 보관함' : 'MediQ combo vault',
    `Date: ${date}`,
    '',
    ...(items.length
      ? items.flatMap((combo, index) => [
          `${index + 1}. ${combo.title}`,
          `- Category: ${combo.category}`,
          `- Summary: ${combo.summary}`,
          '- Items:',
          ...combo.items.map((item) => `  • ${item.name}: ${item.why}`),
          combo.tip ? `- Tip: ${combo.tip}` : '',
          combo.disclaimer ? `- Note: ${combo.disclaimer}` : '',
          '',
        ])
      : [lang === 'ko' ? '- 저장된 꿀조합이 없습니다.' : '- No saved combos.', '']),
    lang === 'ko'
      ? '일반적인 영양·생활 정보이며 진단, 처방 또는 치료를 대체하지 않습니다.'
      : 'General nutrition and lifestyle information; not a diagnosis, prescription, or treatment.',
  ];
  return lines.filter((line) => line !== '').join('\n');
}

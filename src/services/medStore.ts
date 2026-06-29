// '내 약·비타민' 기기 로컬 저장소 (PIPA: 서버로 전송하지 않고 기기에만 보관).
// 사용자가 촬영해 인식한 약/영양제의 텍스트 정보(이름·성분·효능)만 저장한다.
// 원본 이미지는 어디에도 저장하지 않는다. 검색 기록(symptomService)과 달리, 이 목록은
// 사용자가 '재확인'을 위해 명시적으로 저장한 것이므로 내용까지 기기에 보관한다.
import { StoredMed, type RecognizedMedT, type StoredMedT } from '../schemas/aiTools';

const keyFor = (uid: string | undefined) => `medi-curator:meds:${uid ?? 'local'}`;

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadMeds(uid: string | undefined): StoredMedT[] {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate each entry; drop anything that doesn't match (forward-compat / tamper-safe).
    return parsed.flatMap((e) => {
      const r = StoredMed.safeParse(e);
      return r.success ? [r.data] : [];
    });
  } catch {
    return [];
  }
}

function persist(uid: string | undefined, meds: StoredMedT[]): void {
  localStorage.setItem(keyFor(uid), JSON.stringify(meds));
}

export function addMed(uid: string | undefined, rec: RecognizedMedT, note = ''): StoredMedT {
  const entry: StoredMedT = {
    id: newId(),
    addedAt: new Date().toISOString(),
    name: rec.name,
    category: rec.category,
    ingredients: rec.ingredients,
    efficacy: rec.efficacy,
    cautions: rec.cautions,
    disclaimer: rec.disclaimer,
    note,
  };
  const meds = loadMeds(uid);
  meds.unshift(entry);
  persist(uid, meds);
  return entry;
}

export function medNamesText(uid: string | undefined): string {
  return loadMeds(uid)
    .map((m) => m.name.trim())
    .filter(Boolean)
    .join(', ');
}

export function deleteMed(uid: string | undefined, id: string): void {
  persist(uid, loadMeds(uid).filter((m) => m.id !== id));
}

export function deleteAllMeds(uid: string | undefined): void {
  localStorage.removeItem(keyFor(uid));
}

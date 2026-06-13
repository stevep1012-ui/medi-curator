// Device-local search history (AGENTS.md R-002 / PIPA §23).
// Health content (raw symptoms, medications, curation result) is NEVER
// persisted — not even locally. Only non-identifying metadata is stored, keyed
// per user, in localStorage. This keeps a usable "history" surface without
// retaining sensitive data on the device.
import type { CurationResult } from '../types';

export interface SearchRecordMeta {
  id: string;
  language: string;
  createdAt: string; // ISO 8601
}

const keyFor = (uid: string) => `medi-curator:searchHistory:${uid}`;

function loadRecords(uid: string): SearchRecordMeta[] {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SearchRecordMeta[]) : [];
  } catch {
    return [];
  }
}

function persist(uid: string, records: SearchRecordMeta[]): void {
  localStorage.setItem(keyFor(uid), JSON.stringify(records));
}

let counter = 0;
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  counter += 1;
  return `r-${Date.now().toString(36)}-${counter.toString(36)}`;
}

// Note: symptoms / medications / result are accepted to define the call-site
// contract but are intentionally NOT stored (PIPA §23). Only metadata persists.
export async function saveSearchRecord(
  uid: string,
  symptoms: string,
  medications: string,
  result: CurationResult,
  language: string,
): Promise<string> {
  void symptoms;
  void medications;
  void result;
  const id = newId();
  const records = loadRecords(uid);
  records.unshift({ id, language, createdAt: new Date().toISOString() });
  persist(uid, records);
  return id;
}

export async function getSearchHistory(uid: string): Promise<{ records: SearchRecordMeta[] }> {
  return { records: loadRecords(uid) };
}

export async function deleteSearchRecord(uid: string, id: string): Promise<void> {
  persist(uid, loadRecords(uid).filter((r) => r.id !== id));
}

export async function deleteAllSearchRecords(uid: string): Promise<void> {
  localStorage.removeItem(keyFor(uid));
}

export async function exportLocalSearchHistory(uid: string): Promise<SearchRecordMeta[]> {
  return loadRecords(uid);
}

import type { CurationResult, SearchRecord } from '../types';

const PAGE_SIZE_DEFAULT = 10;

interface StoredSearchRecord {
  id: string;
  userId: string;
  symptoms: string;
  currentMedications: string;
  result: CurationResult;
  createdAt: string;
  language: string;
}

function storageKey(userId: string) {
  return `medi-curator:searchHistory:${userId}`;
}

function readRecords(userId: string): StoredSearchRecord[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(userId: string, records: StoredSearchRecord[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(records));
}

function toSearchRecord(record: StoredSearchRecord): SearchRecord {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
  };
}

export async function saveSearchRecord(
  userId: string,
  symptoms: string,
  currentMedications: string,
  result: CurationResult,
  language: string,
): Promise<string> {
  const id = `${Date.now().toString(36)}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  const next: StoredSearchRecord = {
    id,
    userId,
    symptoms,
    currentMedications,
    result,
    language,
    createdAt: new Date().toISOString(),
  };
  const records = [next, ...readRecords(userId)];
  writeRecords(userId, records);
  return id;
}

export async function getSearchHistory(
  userId: string,
  pageSize = PAGE_SIZE_DEFAULT,
  offset = 0,
): Promise<{ records: SearchRecord[]; lastVisible: number | null }> {
  const records = readRecords(userId);
  const page = records.slice(offset, offset + pageSize);
  const nextOffset = offset + page.length;
  return {
    records: page.map(toSearchRecord),
    lastVisible: nextOffset < records.length ? nextOffset : null,
  };
}

export async function deleteSearchRecord(userId: string, recordId: string): Promise<void> {
  const records = readRecords(userId).filter((record) => record.id !== recordId);
  writeRecords(userId, records);
}

export async function deleteAllSearchRecords(userId: string): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(storageKey(userId));
}

export async function exportLocalSearchHistory(userId: string): Promise<SearchRecord[]> {
  return readRecords(userId).map(toSearchRecord);
}

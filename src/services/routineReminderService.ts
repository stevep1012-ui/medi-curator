export type RoutineReminderFrequency = 'daily' | 'weekly';

export type RoutineReminder = {
  enabled: boolean;
  frequency: RoutineReminderFrequency;
  time: string;
  updatedAt: string;
};

const DEFAULT_REMINDER: RoutineReminder = {
  enabled: false,
  frequency: 'daily',
  time: '20:00',
  updatedAt: '',
};

const keyFor = (uid: string | undefined) => `medi-curator:routine-reminder:${uid ?? 'local'}`;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isFrequency(value: unknown): value is RoutineReminderFrequency {
  return value === 'daily' || value === 'weekly';
}

export function loadRoutineReminder(uid?: string): RoutineReminder {
  const s = storage();
  if (!s) return { ...DEFAULT_REMINDER };
  try {
    const parsed = JSON.parse(s.getItem(keyFor(uid)) || 'null') as Partial<RoutineReminder> | null;
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_REMINDER };
    return {
      enabled: parsed.enabled === true,
      frequency: isFrequency(parsed.frequency) ? parsed.frequency : DEFAULT_REMINDER.frequency,
      time: isTime(parsed.time) ? parsed.time : DEFAULT_REMINDER.time,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return { ...DEFAULT_REMINDER };
  }
}

export function saveRoutineReminder(
  uid: string | undefined,
  input: Pick<RoutineReminder, 'enabled' | 'frequency' | 'time'>,
): RoutineReminder {
  const reminder: RoutineReminder = {
    enabled: input.enabled,
    frequency: isFrequency(input.frequency) ? input.frequency : DEFAULT_REMINDER.frequency,
    time: isTime(input.time) ? input.time : DEFAULT_REMINDER.time,
    updatedAt: new Date().toISOString(),
  };
  const s = storage();
  if (s) s.setItem(keyFor(uid), JSON.stringify(reminder));
  return reminder;
}

export function clearRoutineReminder(uid?: string): void {
  const s = storage();
  if (s) s.removeItem(keyFor(uid));
}

export function reminderSummary(reminder: RoutineReminder, lang: 'ko' | 'en' | 'ja' | 'zh' = 'ko'): string {
  if (!reminder.enabled) {
    return lang === 'ko' ? '리마인더 꺼짐' : 'Reminder off';
  }
  const frequency = reminder.frequency === 'daily'
    ? { ko: '매일', en: 'Daily', ja: '毎日', zh: '每天' }
    : { ko: '매주', en: 'Weekly', ja: '毎週', zh: '每周' };
  const suffix = {
    ko: `${frequency.ko} ${reminder.time} 점검`,
    en: `${frequency.en} check-in at ${reminder.time}`,
    ja: `${frequency.ja} ${reminder.time} チェック`,
    zh: `${frequency.zh} ${reminder.time} 检查`,
  };
  return suffix[lang];
}

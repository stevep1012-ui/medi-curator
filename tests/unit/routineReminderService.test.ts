import { beforeEach, describe, expect, it } from 'vitest';
import { clearRoutineReminder, loadRoutineReminder, reminderSummary, saveRoutineReminder } from '../../src/services/routineReminderService';

describe('routineReminderService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reloads a user-scoped local reminder', () => {
    const saved = saveRoutineReminder('user-1', {
      enabled: true,
      frequency: 'weekly',
      time: '21:30',
    });

    expect(saved.enabled).toBe(true);
    expect(loadRoutineReminder('user-1')).toMatchObject({ enabled: true, frequency: 'weekly', time: '21:30' });
    expect(loadRoutineReminder('user-2').enabled).toBe(false);
  });

  it('falls back to a safe default for invalid stored values', () => {
    localStorage.setItem('medi-curator:routine-reminder:user-1', JSON.stringify({ enabled: true, frequency: 'monthly', time: '99:99' }));

    expect(loadRoutineReminder('user-1')).toMatchObject({ enabled: true, frequency: 'daily', time: '20:00' });
  });

  it('clears only the selected user reminder', () => {
    saveRoutineReminder('user-1', { enabled: true, frequency: 'daily', time: '08:00' });
    saveRoutineReminder('user-2', { enabled: true, frequency: 'weekly', time: '09:00' });

    clearRoutineReminder('user-1');

    expect(loadRoutineReminder('user-1').enabled).toBe(false);
    expect(loadRoutineReminder('user-2').enabled).toBe(true);
  });

  it('summarizes enabled and disabled reminder states', () => {
    expect(reminderSummary(loadRoutineReminder('none'), 'ko')).toBe('리마인더 꺼짐');
    expect(reminderSummary({ enabled: true, frequency: 'daily', time: '20:00', updatedAt: 'x' }, 'ko')).toBe('매일 20:00 점검');
    expect(reminderSummary({ enabled: true, frequency: 'weekly', time: '09:15', updatedAt: 'x' }, 'en')).toBe('Weekly check-in at 09:15');
  });
});

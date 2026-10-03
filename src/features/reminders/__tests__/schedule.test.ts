import { formatReminderTime, nextReminderDate, reminderMessage } from '../schedule';

describe('nextReminderDate', () => {
  it('fires later today when the daily is not done yet', () => {
    const d = nextReminderDate(new Date(2026, 9, 5, 10, 0), 19, 0, false);
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([5, 19, 0]);
  });
  it('skips today once the daily is done', () => {
    const d = nextReminderDate(new Date(2026, 9, 5, 10, 0), 19, 0, true);
    expect([d.getDate(), d.getHours()]).toEqual([6, 19]);
  });
  it('moves to tomorrow when the time has passed', () => {
    const d = nextReminderDate(new Date(2026, 9, 5, 20, 0), 19, 0, false);
    expect(d.getDate()).toBe(6);
  });
  it('rolls over month ends', () => {
    const d = nextReminderDate(new Date(2026, 9, 31, 21, 0), 8, 30, false);
    expect([d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([10, 1, 8, 30]);
  });
});

describe('reminder text', () => {
  it('mentions the streak when there is one', () => {
    expect(reminderMessage(3).title).toContain('3-day streak');
    expect(reminderMessage(0).title).toContain('daily puzzle');
  });
  it('formats times', () => {
    expect(formatReminderTime(19, 0)).toBe('7:00 PM');
    expect(formatReminderTime(0, 5)).toBe('12:05 AM');
    expect(formatReminderTime(12, 30)).toBe('12:30 PM');
  });
});

import { DEFAULT_SETTINGS, parseSettings } from '../settings';

describe('parseSettings', () => {
  it('falls back to defaults', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps saved values and fills in new fields from older saves', () => {
    const old = JSON.stringify({ haptics: false, reminderEnabled: true, reminderHour: 8, reminderMinute: 0 });
    expect(parseSettings(old)).toEqual({ ...DEFAULT_SETTINGS, haptics: false, reminderEnabled: true, reminderHour: 8 });
  });

  it('merges partial tutorial flags', () => {
    expect(parseSettings(JSON.stringify({ tutorialsSeen: { classic: true } })).tutorialsSeen).toEqual({ classic: true, chain: false });
  });
});

import { describe, expect, it } from 'vitest';
import { parseThemePreference, readThemePreference, resolveTheme, saveThemePreference, THEME_STORAGE_KEY, THEME_STORAGE_NOTICE } from '../../src/ui/toolkit/theme';

describe('appearance preferences', () => {
  it('keeps the chosen dark direction for absent or unsupported persisted values', () => {
    for (const stored of [null, '', 'sepia', '{"theme":"light"}']) {
      expect(readThemePreference(() => ({ getItem: () => stored }))).toEqual({ preference: 'dark', notice: null });
    }
    expect(parseThemePreference('system')).toBe('system');
  });

  it('persists and restores each supported choice under its own versioned key', () => {
    const entries = new Map<string, string>();
    const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
    for (const preference of ['light', 'dark', 'system'] as const) {
      expect(saveThemePreference(preference, () => storage)).toBeNull();
      expect(entries.get(THEME_STORAGE_KEY)).toBe(preference);
      expect(readThemePreference(() => storage).preference).toBe(preference);
    }
  });

  it('follows OS appearance only when system has been selected', () => {
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('keeps a usable visit when access or writes to browser storage are blocked', () => {
    const denied = () => { throw new Error('SecurityError'); };
    expect(readThemePreference(denied)).toEqual({ preference: 'dark', notice: THEME_STORAGE_NOTICE });
    expect(saveThemePreference('light', denied)).toBe(THEME_STORAGE_NOTICE);
    expect(saveThemePreference('system', () => ({ setItem: denied }))).toBe(THEME_STORAGE_NOTICE);
  });
});

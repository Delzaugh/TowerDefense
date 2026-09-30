export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'tower.ui.appearance.v1';
export const THEME_STORAGE_NOTICE = 'Appearance will apply for this visit. Browser storage is unavailable.';

export function parseThemePreference(value: string | null): ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark' ? value : 'dark';
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  return preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
}

export function readThemePreference(getStorage: () => Pick<Storage, 'getItem'>): { preference: ThemePreference; notice: string | null } {
  try {
    return { preference: parseThemePreference(getStorage().getItem(THEME_STORAGE_KEY)), notice: null };
  } catch {
    return { preference: 'dark', notice: THEME_STORAGE_NOTICE };
  }
}

export function saveThemePreference(preference: ThemePreference, getStorage: () => Pick<Storage, 'setItem'>): string | null {
  try {
    getStorage().setItem(THEME_STORAGE_KEY, preference);
    return null;
  } catch {
    return THEME_STORAGE_NOTICE;
  }
}

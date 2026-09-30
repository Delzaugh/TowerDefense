import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { parseThemePreference, readThemePreference, resolveTheme, saveThemePreference, THEME_STORAGE_KEY, type ResolvedTheme, type ThemePreference } from './theme';

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  notice: string | null;
  setPreference: (preference: ThemePreference) => void;
}
const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => readThemePreference(() => window.localStorage));
  const [preference, updatePreference] = useState(initial.preference);
  const [notice, setNotice] = useState(initial.notice);
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const resolved = resolveTheme(preference, prefersDark);
  const setPreference = useCallback((next: ThemePreference) => {
    updatePreference(next);
    setNotice(saveThemePreference(next, () => window.localStorage));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => setPrefersDark(media.matches);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      // Ignore events from sessionStorage without reading a potentially blocked localStorage getter.
      try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch { return; }
      updatePreference(parseThemePreference(event.newValue));
      setNotice(null);
    };
    media.addEventListener('change', onMediaChange);
    window.addEventListener('storage', onStorage);
    onMediaChange();
    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0d1117' : '#f6f8fa');
  }, [preference, resolved]);

  const state = useMemo(() => ({ preference, resolved, notice, setPreference }), [preference, resolved, notice, setPreference]);
  return <ThemeContext.Provider value={state}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme requires ThemeProvider.');
  return theme;
}

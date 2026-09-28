export interface HomePreferences { readonly ambience: boolean; readonly reducedMotion: boolean }
export const HOME_PREFERENCES_KEY = 'tower.home.preferences.v1';
export const defaultHomePreferences: HomePreferences = Object.freeze({ ambience: true, reducedMotion: false });
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;
export interface HomePreferenceResult { readonly preferences: HomePreferences; readonly notice: string }
const sessionNotice = 'Settings will apply for this visit. This browser could not save them.';

/** Even accessing window.localStorage may throw. */
export function readHomePreferences(storage: () => PreferenceStorage): HomePreferenceResult {
  try {
    const json = storage().getItem(HOME_PREFERENCES_KEY);
    if (json === null) return { preferences: defaultHomePreferences, notice: '' };
    const value: unknown = JSON.parse(json);
    if (typeof value === 'object' && value !== null && 'version' in value && value.version === 1 &&
      'ambience' in value && typeof value.ambience === 'boolean' && 'reducedMotion' in value && typeof value.reducedMotion === 'boolean') {
      return { preferences: Object.freeze({ ambience: value.ambience, reducedMotion: value.reducedMotion }), notice: '' };
    }
    return { preferences: defaultHomePreferences, notice: 'We reset unreadable campus settings to their defaults.' };
  } catch { return { preferences: defaultHomePreferences, notice: sessionNotice }; }
}

export function saveHomePreferences(storage: () => PreferenceStorage, preferences: HomePreferences): string {
  try { storage().setItem(HOME_PREFERENCES_KEY, JSON.stringify({ version: 1, ...preferences })); return ''; }
  catch { return sessionNotice; }
}

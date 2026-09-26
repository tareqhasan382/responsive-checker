import { STORAGE_KEYS } from '@/utils/constants';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;

export const THEME_STORAGE_KEY = STORAGE_KEYS.theme;

export const DEFAULT_THEME: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

/**
 * Inline script that stamps the `dark` class on <html> before first paint.
 *
 * Without this the page would render in the default (light) theme and then
 * flip after hydration, which is a visible flash on every load. It is kept
 * tiny and dependency free, and it duplicates `readStoredTheme` deliberately —
 * it has to run before any bundler module is available.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=p==='light'||p==='dark'?p:(d?'dark':'light');var e=document.documentElement;e.classList.toggle('dark',t==='dark');e.style.colorScheme=t;}catch(_){}})();`;

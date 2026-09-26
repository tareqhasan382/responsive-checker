'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_THEME,
  isThemePreference,
  THEME_STORAGE_KEY,
} from '@/config/theme';
import type { ThemePreference } from '@/config/theme';

export interface UseThemeResult {
  /** What the user chose, which may be `system`. */
  readonly preference: ThemePreference;
  /** What `preference` resolves to right now. */
  readonly resolved: 'light' | 'dark';
  readonly setPreference: (next: ThemePreference) => void;
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(resolved: 'light' | 'dark'): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

/**
 * Owns the colour scheme.
 *
 * The `<html>` class is applied here for the benefit of anything that mounts
 * after hydration; an inline script in the document head does the same thing
 * earlier so the first paint is already correct. `preference` starts as
 * `system` on the server to keep SSR and the first client render identical.
 */
export function useTheme(): UseThemeResult {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(DEFAULT_THEME);
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = readStoredPreference();
    setPreferenceState(stored);
    setResolved(
      stored === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : stored,
    );
  }, []);

  // Follow the OS while the preference is `system`.
  useEffect(() => {
    if (preference !== 'system') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      const next = query.matches ? 'dark' : 'light';
      setResolved(next);
      applyTheme(next);
    };

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    const applied =
      next === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : next;
    setResolved(applied);
    applyTheme(applied);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing modes can reject writes; the theme still applies for
      // this session, it just will not be remembered.
    }
  }, []);

  return { preference, resolved, setPreference };
}

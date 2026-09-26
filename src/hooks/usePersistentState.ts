'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PersistentState<T> {
  readonly value: T;
  readonly setValue: (next: T | ((current: T) => T)) => void;
  /** `true` once the client value has been reconciled with `localStorage`. */
  readonly hydrated: boolean;
}

/**
 * `useState` mirrored into `localStorage`.
 *
 * The initial value is always used for the first render so that server and
 * client markup match; the stored value is applied in an effect afterwards.
 * Callers must pass a `validate` guard so corrupted or outdated persisted
 * shapes can never reach component code.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  validate: (value: unknown) => value is T,
): PersistentState<T> {
  const [value, setValueState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  const initialValueRef = useRef(initialValue);
  const validateRef = useRef(validate);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        setValueState(
          validateRef.current(parsed) ? parsed : initialValueRef.current,
        );
      }
    } catch {
      // `localStorage` throws in some privacy modes — fall back to the default.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled — persistence is best effort.
    }
  }, [hydrated, key, value]);

  const setValue = useCallback((next: T | ((current: T) => T)) => {
    setValueState((current) =>
      typeof next === 'function' ? (next as (previous: T) => T)(current) : next,
    );
  }, []);

  return { value, setValue, hydrated };
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { UrlValidationResult } from '@/types/app';
import { DEFAULT_TARGET_URL, STORAGE_KEYS } from '@/utils/constants';
import { readTargetFromQuery, toTargetUrl, validateUrl } from '@/utils/url';
import { usePersistentState } from './usePersistentState';

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export interface UseTargetUrlResult {
  /** Editable text in the URL field. */
  readonly input: string;
  /** Normalized URL currently loaded in the frame, or `null` before the first commit. */
  readonly target: string | null;
  /** Display name for the current target, e.g. `example.com`. */
  readonly hostname: string | null;
  readonly error: string | null;
  readonly setInput: (value: string) => void;
  readonly submit: () => void;
  /** Re-runs the current target, discarding edits in the field. */
  readonly reset: () => void;
}

export function useTargetUrl(): UseTargetUrlResult {
  const persisted = usePersistentState<string | null>(
    STORAGE_KEYS.targetUrl,
    null,
    isStringOrNull,
  );

  const [input, setInputState] = useState('');
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState(false);

  const {
    setValue: persistTarget,
    hydrated,
    value: persistedTarget,
  } = persisted;

  useEffect(() => {
    if (!hydrated || decoded) return;
    const fromQuery = readTargetFromQuery(window.location.search);
    const initial = fromQuery ?? persistedTarget ?? DEFAULT_TARGET_URL;
    const result = validateUrl(initial);
    if (result.ok) {
      setTarget(result.url);
      setInput(result.url);
    }
    setDecoded(true);
  }, [decoded, hydrated, persistedTarget]);

  const setInput = useCallback((value: string) => {
    setInputState(value);
    setError(null);
  }, []);

  const commit = useCallback(
    (result: UrlValidationResult) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setTarget(result.url);
      setInput(result.url);
      persistTarget(result.url);
    },
    [persistTarget],
  );

  const submit = useCallback(() => {
    commit(validateUrl(input));
  }, [commit, input]);

  const reset = useCallback(() => {
    if (target === null) return;
    setInput(target);
    setError(null);
  }, [target]);

  const hostname = useMemo(() => {
    if (target === null) return null;
    return toTargetUrl(target)?.hostname ?? null;
  }, [target]);

  return { input, target, hostname, error, setInput, submit, reset };
}

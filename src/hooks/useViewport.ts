'use client';

import { useCallback, useMemo } from 'react';

import { VIEWPORT_PRESETS } from '@/config/viewport-presets';
import type { HeightMode, Size, ViewportPreset } from '@/types/viewport';
import { STORAGE_KEYS } from '@/utils/constants';
import {
  DEFAULT_VIEWPORT,
  clampSize,
  createCustomViewportId,
  findPresetBySize,
  rotateSize,
} from '@/utils/viewport';
import { usePersistentState } from './usePersistentState';

function isSize(value: unknown): value is Size {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Size>;
  return (
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number' &&
    Number.isFinite(candidate.width) &&
    Number.isFinite(candidate.height)
  );
}

function isHeightMode(value: unknown): value is HeightMode {
  return value === 'auto' || value === 'fixed';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isCustomPresetList(value: unknown): value is ViewportPreset[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      if (typeof entry !== 'object' || entry === null) return false;
      const candidate = entry as Partial<ViewportPreset>;
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.label === 'string' &&
        typeof candidate.width === 'number' &&
        typeof candidate.height === 'number'
      );
    })
  );
}

export interface UseViewportResult {
  /** Logical frame size in CSS pixels — this is what the target's media queries react to. */
  readonly size: Size;
  /** The unrotated size, which is what preset matching is based on. */
  readonly baseSize: Size;
  readonly heightMode: HeightMode;
  readonly isRotated: boolean;
  /** Built-in presets followed by the user's custom presets. */
  readonly presets: readonly ViewportPreset[];
  /** Preset matching `baseSize`, or `null` for ad-hoc sizes. */
  readonly activePreset: ViewportPreset | null;
  /** Toolbar label: preset name plus orientation, or `Custom size`. */
  readonly activeLabel: string;
  readonly isCustomSize: boolean;
  readonly selectPreset: (preset: ViewportPreset) => void;
  readonly rotate: () => void;
  readonly setHeightMode: (mode: HeightMode) => void;
  readonly setSize: (size: Size) => void;
  readonly addCustomViewport: (input: {
    readonly label: string;
    readonly width: number;
    readonly height: number;
  }) => ViewportPreset;
  readonly removeCustomViewport: (id: string) => void;
}

/**
 * Owns the simulated viewport.
 *
 * Only the *base* (portrait) size and the rotation flag are persisted; the
 * effective size is derived. That keeps `selectPreset`, `rotate` and `setSize`
 * from having to keep two pieces of state in sync.
 */
export function useViewport(): UseViewportResult {
  const storedBaseSize = usePersistentState<Size>(
    STORAGE_KEYS.viewportSize,
    DEFAULT_VIEWPORT,
    isSize,
  );
  const storedRotation = usePersistentState<boolean>(
    STORAGE_KEYS.isRotated,
    false,
    isBoolean,
  );
  const storedHeightMode = usePersistentState<HeightMode>(
    STORAGE_KEYS.heightMode,
    'auto',
    isHeightMode,
  );
  const storedCustomViewports = usePersistentState<ViewportPreset[]>(
    STORAGE_KEYS.customViewports,
    [],
    isCustomPresetList,
  );

  const { setValue: setBaseSize } = storedBaseSize;
  const { setValue: setRotation } = storedRotation;
  const { setValue: setHeightModeValue } = storedHeightMode;
  const { setValue: setCustomViewports } = storedCustomViewports;

  const baseSize = useMemo(
    () => clampSize(storedBaseSize.value),
    [storedBaseSize.value],
  );

  const isRotated = storedRotation.value;

  const size = useMemo(
    () => (isRotated ? rotateSize(baseSize) : baseSize),
    [baseSize, isRotated],
  );

  const selectPreset = useCallback(
    (preset: ViewportPreset) => {
      setBaseSize(clampSize({ width: preset.width, height: preset.height }));
      setRotation(false);
    },
    [setBaseSize, setRotation],
  );

  const rotate = useCallback(() => {
    setRotation((current) => !current);
  }, [setRotation]);

  const setHeightMode = useCallback(
    (mode: HeightMode) => {
      setHeightModeValue(mode);
    },
    [setHeightModeValue],
  );

  const setSize = useCallback(
    (next: Size) => {
      setBaseSize(clampSize(next));
      setRotation(false);
    },
    [setBaseSize, setRotation],
  );

  const addCustomViewport = useCallback(
    ({
      label,
      width,
      height,
    }: {
      label: string;
      width: number;
      height: number;
    }) => {
      const dimensions = clampSize({ width, height });
      const trimmedLabel = label.trim();
      const preset: ViewportPreset = {
        id: createCustomViewportId(trimmedLabel),
        label:
          trimmedLabel.length > 0
            ? trimmedLabel
            : `${dimensions.width} × ${dimensions.height}`,
        category: 'custom',
        width: dimensions.width,
        height: dimensions.height,
        isCustom: true,
      };

      setCustomViewports((current) => [
        ...current.filter((entry) => entry.id !== preset.id),
        preset,
      ]);
      setBaseSize({ width: preset.width, height: preset.height });
      setRotation(false);
      return preset;
    },
    [setBaseSize, setCustomViewports, setRotation],
  );

  const removeCustomViewport = useCallback(
    (id: string) => {
      setCustomViewports((current) =>
        current.filter((entry) => entry.id !== id),
      );
    },
    [setCustomViewports],
  );

  const presets = useMemo<readonly ViewportPreset[]>(
    () => [...VIEWPORT_PRESETS, ...storedCustomViewports.value],
    [storedCustomViewports.value],
  );

  const activePreset = useMemo(
    () => findPresetBySize(presets, baseSize) ?? null,
    [baseSize, presets],
  );

  const baseIsLandscape = baseSize.width >= baseSize.height;
  const activeLabel = activePreset
    ? isRotated
      ? `${activePreset.label} ${baseIsLandscape ? 'portrait' : 'landscape'}`
      : activePreset.label
    : 'Custom size';

  return {
    size,
    baseSize,
    heightMode: storedHeightMode.value,
    isRotated,
    presets,
    activePreset,
    activeLabel,
    isCustomSize: activePreset === null,
    selectPreset,
    rotate,
    setHeightMode,
    setSize,
    addCustomViewport,
    removeCustomViewport,
  };
}

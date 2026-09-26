'use client';

import { useCallback, useMemo } from 'react';

import type { FitMode, HeightMode, Size } from '@/types/viewport';
import { STORAGE_KEYS, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@/utils/constants';
import { calculateFitZoom, clamp, snapZoom } from '@/utils/viewport';
import { usePersistentState } from './usePersistentState';

function isFitMode(value: unknown): value is FitMode {
  return value === 'width' || value === 'screen' || value === 'manual';
}

function isNumberInRange(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export interface UseZoomOptions {
  /** Space available in the preview pane. */
  readonly available: Size;
  /** Selected device size. Only `width` is read while `heightMode` is `auto`. */
  readonly content: Size;
  readonly heightMode: HeightMode;
}

export interface UseZoomResult {
  /** Effective scale factor applied to the frame. */
  readonly zoom: number;
  readonly mode: FitMode;
  readonly isFit: boolean;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  readonly setMode: (mode: FitMode) => void;
  readonly setZoom: (zoom: number) => void;
  readonly stepZoom: (direction: 1 | -1) => void;
}

/**
 * Zoom model.
 *
 * The frame is always rendered at its true CSS-pixel size and scaled with a
 * CSS transform, so the target's media queries and `vw`/`vh` units stay
 * correct at any zoom level.
 */
export function useZoom({
  available,
  content,
  heightMode,
}: UseZoomOptions): UseZoomResult {
  const storedMode = usePersistentState<FitMode>(
    STORAGE_KEYS.fitMode,
    'width',
    isFitMode,
  );
  const storedManualZoom = usePersistentState<number>(
    STORAGE_KEYS.manualZoom,
    1,
    isNumberInRange,
  );

  const { setValue: setMode } = storedMode;
  const { setValue: setManualZoom } = storedManualZoom;

  const mode = storedMode.value;

  const zoom = useMemo(() => {
    if (mode === 'manual') {
      return snapZoom(clamp(storedManualZoom.value, ZOOM_MIN, ZOOM_MAX));
    }
    // A frame that always fills the pane cannot also be fitted on both axes,
    // so filling the height implies a width fit.
    if (heightMode === 'auto') {
      return calculateFitZoom(content, available, 'width');
    }
    return calculateFitZoom(content, available, mode);
  }, [available, content, heightMode, mode, storedManualZoom.value]);

  const setZoom = useCallback(
    (next: number) => {
      setManualZoom(snapZoom(clamp(next, ZOOM_MIN, ZOOM_MAX)));
      setMode('manual');
    },
    [setManualZoom, setMode],
  );

  const stepZoom = useCallback(
    (direction: 1 | -1) => {
      setZoom(zoom + direction * ZOOM_STEP);
    },
    [setZoom, zoom],
  );

  return {
    zoom,
    mode,
    isFit: mode !== 'manual',
    canZoomIn: zoom < ZOOM_MAX - 0.001,
    canZoomOut: zoom > ZOOM_MIN + 0.001,
    setMode,
    setZoom,
    stepZoom,
  };
}

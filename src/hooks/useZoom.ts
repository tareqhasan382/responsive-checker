'use client';

import { useCallback, useMemo } from 'react';

import type { FitMode, HeightMode, Size } from '@/types/viewport';
import { STORAGE_KEYS, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@/utils/constants';
import {
  calculateFitZoom,
  calculateFitToWorkspace,
  clamp,
  snapZoom,
} from '@/utils/viewport';
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
  /** Outer size of the complete device chrome + viewport unit. When provided
   *  the returned zoom is additionally capped so the unit fits the workspace.
   */
  readonly presentation?: Size;
}

export interface UseZoomResult {
  /** Effective scale factor applied to the frame. */
  readonly zoom: number;
  readonly mode: FitMode;
  readonly isFit: boolean;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  /** True when the requested zoom was reduced to keep the unit inside the pane. */
  readonly workspaceCapped: boolean;
  readonly workspaceFitScale: number;
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
 *
 * When `presentation` is supplied the result is additionally capped so the
 * complete device unit (chrome + viewport) never overflows the workspace —
 * that guarantee is stronger than a viewport-only screen-fit because the
 * chrome adds several dozen pixels of bezel around the viewport itself.
 */
export function useZoom({
  available,
  content,
  heightMode,
  presentation,
}: UseZoomOptions): UseZoomResult {
  const storedMode = usePersistentState<FitMode>(
    STORAGE_KEYS.fitMode,
    'screen',
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

  const { workspaceFitScale } = useMemo(() => {
    if (!presentation) {
      return { workspaceFitScale: Number.POSITIVE_INFINITY };
    }
    const fit = calculateFitToWorkspace(available, presentation);
    return { workspaceFitScale: fit.scale };
  }, [available, presentation]);

  const { zoom, workspaceCapped } = useMemo(() => {
    let requested: number;
    if (mode === 'manual') {
      requested = snapZoom(clamp(storedManualZoom.value, ZOOM_MIN, ZOOM_MAX));
    } else if (heightMode === 'auto') {
      requested = calculateFitZoom(content, available, 'width');
    } else {
      const primary = calculateFitZoom(content, available, mode);
      const screenFit = calculateFitZoom(content, available, 'screen');
      requested = Math.min(primary, screenFit);
    }

    if (!Number.isFinite(workspaceFitScale) || workspaceFitScale <= 0) {
      return { zoom: requested, workspaceCapped: false };
    }
    if (requested <= workspaceFitScale + 1e-6) {
      return { zoom: requested, workspaceCapped: false };
    }
    return { zoom: workspaceFitScale, workspaceCapped: true };
  }, [
    available,
    content,
    heightMode,
    mode,
    storedManualZoom.value,
    workspaceFitScale,
  ]);

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
    workspaceCapped,
    workspaceFitScale,
    setMode,
    setZoom,
    stepZoom,
  };
}

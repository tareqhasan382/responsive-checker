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

  const zoom = useMemo(() => {
    if (mode === 'manual') {
      return snapZoom(clamp(storedManualZoom.value, ZOOM_MIN, ZOOM_MAX));
    }
    if (heightMode === 'auto') {
      // A frame that always fills the pane cannot also be fitted on both
      // axes, so filling the height implies a width fit.  display.height
      // is derived from the zoom (via deriveFrameGeometry) and will always
      // match the available height — so there is never any vertical
      // overflow in this mode and we don't need a second cap.
      return calculateFitZoom(content, available, 'width');
    }
    // In fixed-height mode the frame keeps the device's aspect ratio, so a
    // tall viewport selected with only a width fit would overflow the pane
    // vertically.  Always cap to the screen-fit zoom so 2K / 4K / custom
    // and rotated-tall viewports stay fully visible inside the preview.
    const primary = calculateFitZoom(content, available, mode);
    const screenFit = calculateFitZoom(content, available, 'screen');
    return Math.min(primary, screenFit);
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

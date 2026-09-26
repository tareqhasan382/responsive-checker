import {
  DEFAULT_VIEWPORT_HEIGHT,
  DEFAULT_VIEWPORT_WIDTH,
  FIT_ZOOM_MAX,
  MAX_VIEWPORT_HEIGHT,
  MAX_VIEWPORT_WIDTH,
  MIN_VIEWPORT_HEIGHT,
  MIN_VIEWPORT_WIDTH,
  ZOOM_MIN,
  ZOOM_SNAP,
} from './constants';
import type {
  FitMode,
  HeightMode,
  Size,
  ViewportPreset,
} from '@/types/viewport';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function rotateSize(size: Size): Size {
  return { width: size.height, height: size.width };
}

/** Rounds to whole pixels — fractional CSS pixels cause blurry frames. */
export function roundToPixel(value: number): number {
  return Math.round(value);
}

export function snapZoom(value: number): number {
  return Math.round(value / ZOOM_SNAP) * ZOOM_SNAP;
}

export function formatSize(size: Size): string {
  return `${Math.round(size.width)} × ${Math.round(size.height)}`;
}

export function formatZoom(zoom: number): string {
  const percent = Math.round(zoom * 100);
  return `${percent}%`;
}

export function isWithinBounds(width: number, height: number): boolean {
  return (
    width >= MIN_VIEWPORT_WIDTH &&
    width <= MAX_VIEWPORT_WIDTH &&
    height >= MIN_VIEWPORT_HEIGHT &&
    height <= MAX_VIEWPORT_HEIGHT
  );
}

export function clampSize(size: Size): Size {
  return {
    width: clamp(
      roundToPixel(size.width),
      MIN_VIEWPORT_WIDTH,
      MAX_VIEWPORT_WIDTH,
    ),
    height: clamp(
      roundToPixel(size.height),
      MIN_VIEWPORT_HEIGHT,
      MAX_VIEWPORT_HEIGHT,
    ),
  };
}

export function findPresetBySize(
  presets: readonly ViewportPreset[],
  size: Size,
): ViewportPreset | undefined {
  const match = presets.find(
    (preset) => preset.width === size.width && preset.height === size.height,
  );
  return match;
}

/**
 * Computes the scale factor that makes `content` fit `available` for the given mode.
 * Guards against a zero-sized measurement on the first render.
 */
export function calculateFitZoom(
  content: Size,
  available: Size,
  mode: Exclude<FitMode, 'manual'>,
): number {
  if (content.width <= 0 || content.height <= 0) return 1;
  if (available.width <= 0 || available.height <= 0) return 1;

  const zoom =
    mode === 'width'
      ? available.width / content.width
      : Math.min(
          available.width / content.width,
          available.height / content.height,
        );

  // Deliberately not snapped to ZOOM_SNAP increments: a rounded-up value would
  // make "fit" overflow the pane it is supposed to fit into.
  return clamp(Math.round(zoom * 1000) / 1000, ZOOM_MIN, FIT_ZOOM_MAX);
}

export function createCustomViewportId(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug.length > 0 ? `custom-${slug}` : `custom-${Date.now()}`;
}

/** Upper bound for the computed height when the frame fills the pane. */
export const MAX_AUTO_FRAME_HEIGHT = 5000;

export interface FrameGeometryInput {
  /** The selected device size. */
  readonly viewportSize: Size;
  readonly heightMode: HeightMode;
  /** Usable space in the preview pane, excluding padding. */
  readonly available: Size;
  readonly zoom: number;
}

export interface FrameGeometry {
  /** Logical size the target page sees, in CSS pixels. */
  readonly content: Size;
  /** On-screen size once the frame is scaled. */
  readonly display: Size;
}

/**
 * Resolves the two sizes the preview needs.
 *
 * In `auto` height mode the frame is stretched to fill the pane, so its logical
 * height is derived from the space left after scaling — the width always comes
 * from the selected device.
 */
export function deriveFrameGeometry({
  viewportSize,
  heightMode,
  available,
  zoom,
}: FrameGeometryInput): FrameGeometry {
  const scale = Math.max(zoom, 0.01);
  const width = Math.max(1, Math.round(viewportSize.width));
  const height =
    heightMode === 'auto'
      ? Math.min(
          MAX_AUTO_FRAME_HEIGHT,
          Math.max(1, Math.round(available.height / scale)),
        )
      : Math.max(1, Math.round(viewportSize.height));

  const content: Size = { width, height };

  return {
    content,
    display: {
      width: Math.round(content.width * scale),
      height: Math.round(content.height * scale),
    },
  };
}

export const DEFAULT_VIEWPORT: Size = {
  width: DEFAULT_VIEWPORT_WIDTH,
  height: DEFAULT_VIEWPORT_HEIGHT,
};

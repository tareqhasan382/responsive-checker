export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.25;
/** Fit modes never upscale beyond 100% — upscaled frames are blurry and misleading. */
export const FIT_ZOOM_MAX = 1;
export const ZOOM_SNAP = 0.05;

/** Zoom levels offered in the zoom menu. */
export const ZOOM_PRESETS = [
  0.5, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2,
] as const;

/**
 * Custom viewport bounds. Wide enough to cover anything worth testing, narrow
 * enough that a stray value cannot make the frame unusable.
 */
export const MIN_VIEWPORT_WIDTH = 100;
export const MAX_VIEWPORT_WIDTH = 5000;
export const MIN_VIEWPORT_HEIGHT = 100;
export const MAX_VIEWPORT_HEIGHT = 5000;

export const DEFAULT_VIEWPORT_WIDTH = 1280;
export const DEFAULT_VIEWPORT_HEIGHT = 720;

/** Breathing room around the frame inside the preview pane. */
export const PREVIEW_GUTTER = 8;

/** If the browser has not reported a load event by now we surface a hint. */
export const FRAME_LOAD_TIMEOUT_MS = 12_000;

export const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

export const EXAMPLE_TARGETS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'https://example.com',
] as const;

export const STORAGE_KEYS = {
  targetUrl: 'responsive-checker:target-url',
  customViewports: 'responsive-checker:custom-viewports',
  viewportSize: 'responsive-checker:viewport-size',
  heightMode: 'responsive-checker:height-mode',
  isRotated: 'responsive-checker:is-rotated',
  fitMode: 'responsive-checker:fit-mode',
  manualZoom: 'responsive-checker:manual-zoom',
  theme: 'responsive-checker:theme',
} as const;

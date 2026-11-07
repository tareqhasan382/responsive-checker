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
  BezelPadding,
  DeviceFamily,
  DeviceOrientation,
  FitMode,
  HeightMode,
  Size,
  ViewportCategory,
  ViewportPreset,
  ViewportRegion,
} from '@/types/viewport';

/**
 * Hardware drawn around the screen, in CSS pixels, per device family and
 * orientation.
 *
 * Handhelds are treated as a physical object that can be turned: rotating a
 * phone moves its wide "chin" bezel from the bottom edge to the right edge and
 * its island from the top edge to the left edge, which is why landscape needs
 * its own numbers. Desktop and TV stands stay planted, so both orientations
 * share one bezel there.
 */
export const DEVICE_BEZEL_MOBILE: BezelPadding = {
  top: 48,
  right: 14,
  bottom: 28,
  left: 14,
};

export const DEVICE_BEZEL_MOBILE_LANDSCAPE: BezelPadding = {
  top: 34,
  right: 30,
  bottom: 34,
  left: 48,
};

export const DEVICE_BEZEL_TABLET: BezelPadding = {
  top: 32,
  right: 20,
  bottom: 20,
  left: 20,
};

/** iPad-style slabs are symmetric, so every edge stays the same thickness. */
export const DEVICE_BEZEL_TABLET_LANDSCAPE: BezelPadding = {
  top: 26,
  right: 26,
  bottom: 26,
  left: 26,
};

export const DEVICE_BEZEL_DESKTOP: BezelPadding = {
  top: 40,
  right: 12,
  bottom: 60,
  left: 12,
};

export const DEVICE_BEZEL_TV: BezelPadding = {
  top: 24,
  right: 24,
  bottom: 56,
  left: 24,
};

const DEVICE_BEZELS: Record<
  DeviceFamily,
  Record<DeviceOrientation, BezelPadding>
> = {
  mobile: {
    portrait: DEVICE_BEZEL_MOBILE,
    landscape: DEVICE_BEZEL_MOBILE_LANDSCAPE,
  },
  tablet: {
    portrait: DEVICE_BEZEL_TABLET,
    landscape: DEVICE_BEZEL_TABLET_LANDSCAPE,
  },
  desktop: {
    portrait: DEVICE_BEZEL_DESKTOP,
    landscape: DEVICE_BEZEL_DESKTOP,
  },
  tv: {
    portrait: DEVICE_BEZEL_TV,
    landscape: DEVICE_BEZEL_TV,
  },
};

/** Above this aspect ratio a "tablet" is really an ultrawide desktop. */
const TABLET_MAX_ASPECT = 2.2;

/** Narrows at or below this are drawn as a phone. */
const MOBILE_MAX_SHORT_EDGE = 500;

/** Narrows at or below this (and not ultrawide) are drawn as a tablet. */
const TABLET_MAX_SHORT_EDGE = 1300;

/**
 * Which device a size should be drawn as.
 *
 * Categories answer directly; an ad-hoc custom size falls back to its narrow
 * edge, which is what makes a hand-typed `844 × 390` render as a phone turned
 * on its side rather than as a desktop.
 */
export function resolveDeviceFamily(
  category: ViewportCategory | undefined,
  size: Size,
): DeviceFamily {
  switch (category) {
    case 'mobile':
      return 'mobile';
    case 'tablet':
      return 'tablet';
    case 'desktop':
    case '2k':
    case '4k':
      return 'desktop';
    case 'tv':
      return 'tv';
    case 'custom':
    default: {
      const narrow = Math.min(size.width, size.height);
      if (narrow <= MOBILE_MAX_SHORT_EDGE) return 'mobile';
      if (
        narrow <= TABLET_MAX_SHORT_EDGE &&
        Math.max(size.width, size.height) / narrow <= TABLET_MAX_ASPECT
      ) {
        return 'tablet';
      }
      return 'desktop';
    }
  }
}

/** Orientation implied by a size alone. Square sizes are treated as portrait. */
export function resolveOrientation(size: Size): DeviceOrientation {
  return size.width > size.height ? 'landscape' : 'portrait';
}

/**
 * Orientation of the *device*, which is not always the orientation of the size
 * the screen is currently laid out at.
 *
 * A phone is a rigid object and its screen covers the whole face, so turning it
 * turns the screen too. Deriving it from the unrotated size plus the rotation
 * flag — rather than from the current screen box — keeps the hardware stable in
 * `auto` height mode, where the screen is stretched far past the device's own
 * proportions.
 */
export function resolveDeviceOrientation({
  size,
  isRotated,
}: {
  /** The unrotated device size. */
  readonly size: Size;
  readonly isRotated?: boolean | undefined;
}): DeviceOrientation {
  return resolveOrientation(isRotated === true ? rotateSize(size) : size);
}

export function getBezelForCategory(
  category: ViewportCategory | undefined,
  size: Size,
  orientation: DeviceOrientation = resolveOrientation(size),
): BezelPadding {
  return DEVICE_BEZELS[resolveDeviceFamily(category, size)][orientation];
}

export interface FitToWorkspaceResult {
  readonly scale: number;
  readonly fittedSize: Size;
}

export function calculateFitToWorkspace(
  workspace: Size,
  presentation: Size,
  maxUpscale: number = FIT_ZOOM_MAX,
): FitToWorkspaceResult {
  if (
    workspace.width <= 0 ||
    workspace.height <= 0 ||
    presentation.width <= 0 ||
    presentation.height <= 0
  ) {
    return {
      scale: 1,
      fittedSize: {
        width: Math.max(0, Math.round(presentation.width)),
        height: Math.max(0, Math.round(presentation.height)),
      },
    };
  }

  const rawScale = Math.min(
    workspace.width / presentation.width,
    workspace.height / presentation.height,
    maxUpscale,
  );

  const scale = clamp(
    Math.round(rawScale * 1000) / 1000,
    ZOOM_MIN,
    FIT_ZOOM_MAX,
  );

  return {
    scale,
    fittedSize: {
      width: Math.max(0, Math.round(presentation.width * scale)),
      height: Math.max(0, Math.round(presentation.height * scale)),
    },
  };
}

export interface PresentationGeometry {
  readonly presentation: Size;
  readonly viewportInPresentation: ViewportRegion;
  readonly bezel: BezelPadding;
}

export function derivePresentationGeometry({
  viewportSize,
  category,
  bezel,
  orientation,
}: {
  readonly viewportSize: Size;
  readonly category?: ViewportCategory | undefined;
  readonly bezel?: BezelPadding | undefined;
  /** Orientation of the device the screen belongs to. */
  readonly orientation?: DeviceOrientation | undefined;
}): PresentationGeometry {
  const resolvedBezel =
    bezel ?? getBezelForCategory(category, viewportSize, orientation);
  const width = Math.max(1, Math.round(viewportSize.width));
  const height = Math.max(1, Math.round(viewportSize.height));

  const presentation: Size = {
    width: width + resolvedBezel.left + resolvedBezel.right,
    height: height + resolvedBezel.top + resolvedBezel.bottom,
  };

  const viewportInPresentation: ViewportRegion = {
    top: resolvedBezel.top,
    left: resolvedBezel.left,
    width,
    height,
  };

  return { presentation, viewportInPresentation, bezel: resolvedBezel };
}

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
  /** The selected device size, already rotated if the device is turned. */
  readonly viewportSize: Size;
  /**
   * The device's own size before rotation and before `auto` height mode
   * stretches the screen. Decides which device the frame is drawn as; defaults
   * to `viewportSize`.
   */
  readonly deviceSize?: Size;
  /** Whether the device is physically turned 90° from `deviceSize`. */
  readonly isRotated?: boolean;
  readonly heightMode: HeightMode;
  /** Usable space in the preview pane, excluding padding. */
  readonly available: Size;
  readonly zoom: number;
  readonly category?: ViewportCategory | undefined;
}

export interface FrameGeometry {
  /** Logical size the target page sees, in CSS pixels. */
  readonly content: Size;
  /** On-screen size once the frame is scaled. */
  readonly display: Size;
  /** Full presentation size including device chrome/bezel pixels at zoom=1. */
  readonly presentation: Size;
  /** Post-fit size of the complete presentation unit after applying zoom. */
  readonly fittedPresentation: Size;
  /** Region of the viewport inside the natural (pre-scale) presentation box. */
  readonly viewportInPresentation: ViewportRegion;
  /** Bezel applied. */
  readonly bezel: BezelPadding;
}

/**
 * Resolves the sizes the preview needs.
 *
 * In `auto` height mode the frame is stretched to fill the pane, so its logical
 * height is derived from the space left after scaling — the width always comes
 * from the selected device. The bezel is still resolved from the device's own
 * size and orientation, so filling the pane never changes which hardware the
 * frame is drawn as.
 */
export function deriveFrameGeometry({
  viewportSize,
  deviceSize,
  isRotated,
  heightMode,
  available,
  zoom,
  category,
}: FrameGeometryInput): FrameGeometry {
  const scale = Math.max(zoom, 0.01);
  const width = Math.max(1, Math.round(viewportSize.width));
  const contentHeight =
    heightMode === 'auto'
      ? Math.min(
          MAX_AUTO_FRAME_HEIGHT,
          Math.max(1, Math.round(available.height / scale)),
        )
      : Math.max(1, Math.round(viewportSize.height));

  const content: Size = { width, height: contentHeight };

  const hardware = deviceSize ?? viewportSize;
  const bezel = getBezelForCategory(
    category,
    hardware,
    resolveDeviceOrientation({ size: hardware, isRotated }),
  );
  const { presentation, viewportInPresentation } = derivePresentationGeometry({
    viewportSize: content,
    bezel,
  });

  return {
    content,
    display: {
      width: Math.round(content.width * scale),
      height: Math.round(content.height * scale),
    },
    presentation,
    fittedPresentation: {
      width: Math.max(1, Math.round(presentation.width * scale)),
      height: Math.max(1, Math.round(presentation.height * scale)),
    },
    viewportInPresentation,
    bezel,
  };
}

export const DEFAULT_VIEWPORT: Size = {
  width: DEFAULT_VIEWPORT_WIDTH,
  height: DEFAULT_VIEWPORT_HEIGHT,
};

import type {
  DeviceFamily,
  DeviceOrientation,
  Size,
  ViewportRegion,
} from '@/types/viewport';
import { clamp } from './viewport';

/**
 * Geometry of the hardware drawn around the screen.
 *
 * Every number describes a real device and is expressed in the unscaled CSS
 * pixels of the frame, so the chrome is laid out at 1:1 and then scaled by the
 * same transform as the screen it frames.
 *
 * The layout is orientation-aware because a phone is a physical object: turning
 * it 90° counter-clockwise — the way a right-handed grip rotates it — moves the
 * island from the top edge to the left edge, the home indicator from the bottom
 * edge to the right edge, the volume rocker from the left edge down to the
 * bottom edge, and the side key from the right edge up to the top edge. Nothing
 * about the phone changes size, only where it sits on the frame, which is why
 * every dimension is derived from the device's *short* edge: both orientations
 * come out proportionally identical.
 */

/** Dynamic Island. */
const ISLAND_THICKNESS = 30;
const LENS_SIZE = 10;
const LENS_INSET = 16;

/** Keys. They stick out of the body, the way physical keys do. */
const KEY_PROTRUSION = 4;
const KEY_THICKNESS = 4;
const RINGER_KEY_LENGTH = 30;
const VOLUME_KEY_LENGTH = 48;
const SIDE_KEY_LENGTH = 96;
const KEY_GAP = 10;
/** Where the key stack starts, as a fraction of the device's long edge. */
const KEY_STACK_START = 0.14;

/** Home indicator. */
const HOME_INDICATOR_THICKNESS = 5;

/** Breaks in the frame where the antennas sit. */
const RAIL_MARK_LENGTH = 12;
const RAIL_MARK_THICKNESS = 3;
const RAIL_MARK_RATIO = 0.075;

/** Front camera on a tablet. */
const TABLET_CAMERA_SIZE = 9;
/** Thinnest chin that can host a home indicator. */
const TABLET_MIN_CHIN = 14;

function round(value: number): number {
  return Math.round(value);
}

function region(
  top: number,
  left: number,
  width: number,
  height: number,
): ViewportRegion {
  return { top, left, width, height };
}

/** Center of the screen along the device's long edge. */
function screenCenter(viewport: ViewportRegion, isLandscape: boolean): number {
  return isLandscape
    ? viewport.top + viewport.height / 2
    : viewport.left + viewport.width / 2;
}

/**
 * A key protruding from the frame's leading long edge: the left edge in
 * portrait, the bottom edge once the device is turned.
 */
function leadingKey(
  presentation: Size,
  isLandscape: boolean,
  along: number,
  length: number,
): ViewportRegion {
  return isLandscape
    ? region(presentation.height, round(along), length, KEY_THICKNESS)
    : region(round(along), -KEY_PROTRUSION, KEY_THICKNESS, length);
}

/** The mirror of {@link leadingKey}: the right edge in portrait, top in landscape. */
function trailingKey(
  presentation: Size,
  isLandscape: boolean,
  along: number,
  length: number,
): ViewportRegion {
  return isLandscape
    ? region(-KEY_PROTRUSION, round(along), length, KEY_THICKNESS)
    : region(round(along), presentation.width, KEY_THICKNESS, length);
}

/** The Dynamic Island, centered on the frame edge the device's top became. */
function islandPill(
  viewport: ViewportRegion,
  isLandscape: boolean,
  length: number,
): ViewportRegion {
  const center = screenCenter(viewport, isLandscape);
  return isLandscape
    ? region(
        round(center - length / 2),
        round((viewport.left - ISLAND_THICKNESS) / 2),
        ISLAND_THICKNESS,
        length,
      )
    : region(
        round((viewport.top - ISLAND_THICKNESS) / 2),
        round(center - length / 2),
        length,
        ISLAND_THICKNESS,
      );
}

/** Camera lens inside the island, on the end the device's right edge became. */
function islandLens(
  island: ViewportRegion,
  isLandscape: boolean,
): ViewportRegion {
  return isLandscape
    ? region(
        island.top + LENS_INSET,
        round(island.left + (island.width - LENS_SIZE) / 2),
        LENS_SIZE,
        LENS_SIZE,
      )
    : region(
        round(island.top + (island.height - LENS_SIZE) / 2),
        island.left + island.width - LENS_INSET - LENS_SIZE,
        LENS_SIZE,
        LENS_SIZE,
      );
}

/** Home indicator, centered on the frame edge the device's chin became. */
function homeBar(
  presentation: Size,
  viewport: ViewportRegion,
  isLandscape: boolean,
  length: number,
  thickness: number,
): ViewportRegion {
  const chin = isLandscape
    ? presentation.width - viewport.left - viewport.width
    : presentation.height - viewport.top - viewport.height;
  const offset = round(chin * 0.42);
  const center = screenCenter(viewport, isLandscape);
  return isLandscape
    ? region(
        round(center - length / 2),
        presentation.width - offset - thickness,
        thickness,
        length,
      )
    : region(
        presentation.height - offset - thickness,
        round(center - length / 2),
        length,
        thickness,
      );
}

/** One antenna break in the frame, on one of its long edges. */
function railMark(
  presentation: Size,
  isLandscape: boolean,
  along: number,
): ViewportRegion {
  return isLandscape
    ? region(
        presentation.height - RAIL_MARK_THICKNESS / 2,
        round(along),
        RAIL_MARK_LENGTH,
        RAIL_MARK_THICKNESS,
      )
    : region(
        round(along),
        -RAIL_MARK_THICKNESS / 2,
        RAIL_MARK_THICKNESS,
        RAIL_MARK_LENGTH,
      );
}

export interface StatusBarLayout {
  /** Height of the strip the clock and the indicators sit in. */
  readonly height: number;
  /** Inset of the clock and the indicator cluster from the frame edges. */
  readonly inset: number;
}

export interface PhoneChromeLayout {
  readonly orientation: DeviceOrientation;
  /** Corner radius of the device body. */
  readonly bodyRadius: number;
  /** Corner radius of the screen, which is inset inside the body. */
  readonly screenRadius: number;
  readonly island: ViewportRegion;
  readonly lens: ViewportRegion;
  readonly statusBar: StatusBarLayout;
  /** Ringer switch and volume keys. */
  readonly ringer: ViewportRegion;
  readonly volumeUp: ViewportRegion;
  readonly volumeDown: ViewportRegion;
  /** Side (power) key. */
  readonly sideKey: ViewportRegion;
  readonly homeIndicator: ViewportRegion;
  readonly railMarks: readonly ViewportRegion[];
}

/**
 * Phone chrome for one frame box.
 *
 * `presentation` is the whole drawn device and `viewport` is the screen region
 * inside it. Every part is anchored to the frame or to the screen rather than
 * to a fixed offset, because the bezel is the only thing that differs between
 * orientations.
 */
export function computePhoneChromeLayout({
  presentation,
  viewport,
  orientation,
}: {
  readonly presentation: Size;
  readonly viewport: ViewportRegion;
  readonly orientation: DeviceOrientation;
}): PhoneChromeLayout {
  const isLandscape = orientation === 'landscape';
  // Measured on the screen, not the body: the screen is what turns, so the two
  // orientations come out with byte-identical hardware.
  const screenLong = Math.max(viewport.width, viewport.height);
  const screenShort = Math.min(viewport.width, viewport.height);

  const bodyRadius = clamp(round(screenShort * 0.155), 40, 56);
  const screenRadius = Math.max(0, bodyRadius - 9);
  const islandLength = clamp(round(screenShort * 0.28), 92, 150);
  const homeLength = clamp(round(screenShort * 0.34), 104, 190);

  // Keys run along the long edge, measured from the end the island sits on.
  const stackStart = round(screenLong * KEY_STACK_START);
  const volumeUpStart = stackStart + RINGER_KEY_LENGTH + KEY_GAP;
  const volumeDownStart = volumeUpStart + VOLUME_KEY_LENGTH + KEY_GAP;
  const sideKeyStart =
    volumeUpStart + (VOLUME_KEY_LENGTH - SIDE_KEY_LENGTH) / 2;

  const island = islandPill(viewport, isLandscape, islandLength);

  return {
    orientation,
    bodyRadius,
    screenRadius,
    island,
    lens: islandLens(island, isLandscape),
    statusBar: {
      height: viewport.top,
      // In landscape the island owns the left edge, so the clock steps in
      // further to stay clear of it.
      inset: clamp(viewport.left + 8, 20, 64),
    },
    ringer: leadingKey(
      presentation,
      isLandscape,
      stackStart,
      RINGER_KEY_LENGTH,
    ),
    volumeUp: leadingKey(
      presentation,
      isLandscape,
      volumeUpStart,
      VOLUME_KEY_LENGTH,
    ),
    volumeDown: leadingKey(
      presentation,
      isLandscape,
      volumeDownStart,
      VOLUME_KEY_LENGTH,
    ),
    sideKey: trailingKey(
      presentation,
      isLandscape,
      sideKeyStart,
      SIDE_KEY_LENGTH,
    ),
    homeIndicator: homeBar(
      presentation,
      viewport,
      isLandscape,
      homeLength,
      HOME_INDICATOR_THICKNESS,
    ),
    railMarks: [RAIL_MARK_RATIO, 1 - RAIL_MARK_RATIO].map((ratio) =>
      railMark(
        presentation,
        isLandscape,
        screenLong * ratio - RAIL_MARK_LENGTH / 2,
      ),
    ),
  };
}

export interface TabletChromeLayout {
  readonly bodyRadius: number;
  readonly screenRadius: number;
  /** Front camera, on the frame edge the device's top turned into. */
  readonly camera: ViewportRegion;
  /** Home indicator, or `null` when the chin is too thin to hold one. */
  readonly homeIndicator: ViewportRegion | null;
}

/**
 * Tablet chrome. Slabs are near-symmetric, so only the front camera and the
 * home indicator are orientation-aware, and they rotate the same way a phone's
 * do.
 */
export function computeTabletChromeLayout({
  presentation,
  viewport,
  orientation,
}: {
  readonly presentation: Size;
  readonly viewport: ViewportRegion;
  readonly orientation: DeviceOrientation;
}): TabletChromeLayout {
  const isLandscape = orientation === 'landscape';
  const screenShort = Math.min(viewport.width, viewport.height);
  const bodyRadius = clamp(round(screenShort * 0.06), 26, 44);
  const screenRadius = Math.max(0, bodyRadius - 7);
  const center = screenCenter(viewport, isLandscape);

  const camera = isLandscape
    ? region(
        round(center - TABLET_CAMERA_SIZE / 2),
        round((viewport.left - TABLET_CAMERA_SIZE) / 2),
        TABLET_CAMERA_SIZE,
        TABLET_CAMERA_SIZE,
      )
    : region(
        round((viewport.top - TABLET_CAMERA_SIZE) / 2),
        round(center - TABLET_CAMERA_SIZE / 2),
        TABLET_CAMERA_SIZE,
        TABLET_CAMERA_SIZE,
      );

  const chin = isLandscape
    ? presentation.width - viewport.left - viewport.width
    : presentation.height - viewport.top - viewport.height;

  return {
    bodyRadius,
    screenRadius,
    camera,
    homeIndicator:
      chin < TABLET_MIN_CHIN
        ? null
        : homeBar(
            presentation,
            viewport,
            isLandscape,
            clamp(round(screenShort * 0.3), 120, 220),
            HOME_INDICATOR_THICKNESS,
          ),
  };
}

/** Corner radius of the screen for a device family. */
export function computeScreenRadius({
  family,
  presentation,
  viewport,
  orientation,
}: {
  readonly family: DeviceFamily;
  readonly presentation: Size;
  readonly viewport: ViewportRegion;
  readonly orientation: DeviceOrientation;
}): number {
  switch (family) {
    case 'mobile':
      return computePhoneChromeLayout({
        presentation,
        viewport,
        orientation,
      }).screenRadius;
    case 'tablet':
      return computeTabletChromeLayout({
        presentation,
        viewport,
        orientation,
      }).screenRadius;
    case 'desktop':
    case 'tv':
    default:
      return 6;
  }
}

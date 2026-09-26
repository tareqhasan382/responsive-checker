export interface Size {
  readonly width: number;
  readonly height: number;
}

export type ViewportCategory =
  'mobile' | 'tablet' | 'laptop' | 'desktop' | 'custom';

export interface ViewportPreset {
  /** Stable identifier, also used as the localStorage key for custom presets. */
  readonly id: string;
  readonly label: string;
  readonly category: ViewportCategory;
  readonly width: number;
  readonly height: number;
  /** Reference device pixel ratio. Informational only — the browser keeps its own DPR. */
  readonly devicePixelRatio?: number;
  /** Custom presets are user defined and can be deleted. */
  readonly isCustom?: boolean;
}

/** How the height of the preview frame is derived. */
export type HeightMode =
  /** Frame fills the available pane height (scaled). Best for inspecting more content. */
  | 'auto'
  /** Frame uses the exact preset height. Best for accurate `vh`-based layouts. */
  | 'fixed';

/** How the current zoom level is derived. */
export type FitMode =
  /** Scale so the full frame width is visible. */
  | 'width'
  /** Scale so the entire frame is visible. */
  | 'screen'
  /** Use the user supplied zoom value verbatim. */
  | 'manual';

import type { ViewportCategory, ViewportPreset } from '@/types/viewport';

/**
 * Portrait reference sizes, grouped by screen class.
 *
 * Landscape variants are intentionally absent: the toolbar derives them by
 * swapping width and height, so listing both would double the list with
 * duplicates that can never disagree with the rotation logic.
 */
export const VIEWPORT_PRESETS = [
  // Mobile
  {
    id: 'mobile-320',
    label: 'Small phone',
    category: 'mobile',
    width: 320,
    height: 568,
    devicePixelRatio: 2,
  },
  {
    id: 'mobile-360',
    label: 'Android',
    category: 'mobile',
    width: 360,
    height: 800,
    devicePixelRatio: 3,
  },
  {
    id: 'mobile-375',
    label: 'iPhone SE',
    category: 'mobile',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
  },
  {
    id: 'mobile-390',
    label: 'iPhone 13',
    category: 'mobile',
    width: 390,
    height: 844,
    devicePixelRatio: 3,
  },
  {
    id: 'mobile-393',
    label: 'iPhone 15',
    category: 'mobile',
    width: 393,
    height: 852,
    devicePixelRatio: 3,
  },
  {
    id: 'mobile-412',
    label: 'Pixel 8',
    category: 'mobile',
    width: 412,
    height: 915,
    devicePixelRatio: 2.625,
  },
  {
    id: 'mobile-430',
    label: 'iPhone 15 Pro Max',
    category: 'mobile',
    width: 430,
    height: 932,
    devicePixelRatio: 3,
  },

  // Tablet
  {
    id: 'tablet-600',
    label: 'Small tablet',
    category: 'tablet',
    width: 600,
    height: 1024,
    devicePixelRatio: 2,
  },
  {
    id: 'tablet-768',
    label: 'iPad portrait',
    category: 'tablet',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
  },
  {
    id: 'tablet-820',
    label: 'iPad Air',
    category: 'tablet',
    width: 820,
    height: 1180,
    devicePixelRatio: 2,
  },
  {
    id: 'tablet-834',
    label: 'iPad Pro 11"',
    category: 'tablet',
    width: 834,
    height: 1194,
    devicePixelRatio: 2,
  },
  {
    id: 'tablet-1024',
    label: 'iPad Pro 12.9"',
    category: 'tablet',
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
  },

  // Desktop
  {
    id: 'desktop-1280',
    label: 'Laptop',
    category: 'desktop',
    width: 1280,
    height: 720,
    devicePixelRatio: 1,
  },
  {
    id: 'desktop-1366',
    label: 'Surface Laptop',
    category: 'desktop',
    width: 1366,
    height: 768,
    devicePixelRatio: 1,
  },
  {
    id: 'desktop-1440',
    label: 'MacBook Air 13"',
    category: 'desktop',
    width: 1440,
    height: 900,
    devicePixelRatio: 2,
  },
  {
    id: 'desktop-1536',
    label: 'MacBook Pro 14"',
    category: 'desktop',
    width: 1536,
    height: 864,
    devicePixelRatio: 2,
  },
  {
    id: 'desktop-1600',
    label: 'Large laptop',
    category: 'desktop',
    width: 1600,
    height: 900,
    devicePixelRatio: 1,
  },
  {
    id: 'desktop-1920',
    label: 'Full HD 1080p',
    category: 'desktop',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
  },

  // 2K
  {
    id: '2k-2560',
    label: 'QHD 1440p',
    category: '2k',
    width: 2560,
    height: 1440,
    devicePixelRatio: 1,
  },

  // 4K
  {
    id: '4k-3840',
    label: 'UHD 4K',
    category: '4k',
    width: 3840,
    height: 2160,
    devicePixelRatio: 1,
  },
] as const satisfies readonly ViewportPreset[];

/** Order the category tabs are shown in. `custom` is rendered separately. */
export const VIEWPORT_CATEGORIES = [
  'mobile',
  'tablet',
  'desktop',
  '2k',
  '4k',
] as const satisfies readonly ViewportCategory[];

export const VIEWPORT_CATEGORY_LABELS: Record<
  Exclude<ViewportCategory, 'custom'>,
  string
> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  '2k': '2K',
  '4k': '4K',
};

/** Quick-fill widths offered in the custom viewport dialog. */
export const VIEWPORT_WIDTH_SHORTCUTS = [
  320, 360, 375, 390, 414, 480, 600, 768, 834, 1024, 1280, 1366, 1440, 1536,
  1600, 1920, 2560,
] as const;

import type { ViewportCategory, ViewportPreset } from '@/types/viewport';

/**
 * Portrait reference sizes. Rotate any preset from the toolbar to get the
 * landscape counterpart, so landscape variants are not duplicated here.
 */
export const VIEWPORT_PRESETS = [
  {
    id: 'iphone-se',
    label: 'iPhone SE',
    category: 'mobile',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
  },
  {
    id: 'iphone-13',
    label: 'iPhone 13',
    category: 'mobile',
    width: 390,
    height: 844,
    devicePixelRatio: 3,
  },
  {
    id: 'iphone-15-pro-max',
    label: 'iPhone 15 Pro Max',
    category: 'mobile',
    width: 430,
    height: 932,
    devicePixelRatio: 3,
  },
  {
    id: 'pixel-8',
    label: 'Pixel 8',
    category: 'mobile',
    width: 412,
    height: 915,
    devicePixelRatio: 2.625,
  },
  {
    id: 'galaxy-s24',
    label: 'Galaxy S24',
    category: 'mobile',
    width: 360,
    height: 780,
    devicePixelRatio: 3,
  },
  {
    id: 'ipad-mini',
    label: 'iPad mini',
    category: 'tablet',
    width: 744,
    height: 1133,
    devicePixelRatio: 2,
  },
  {
    id: 'ipad-air-11',
    label: 'iPad Air 11"',
    category: 'tablet',
    width: 820,
    height: 1180,
    devicePixelRatio: 2,
  },
  {
    id: 'ipad-pro-13',
    label: 'iPad Pro 13"',
    category: 'tablet',
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
  },
  {
    id: 'galaxy-tab-s9',
    label: 'Galaxy Tab S9',
    category: 'tablet',
    width: 800,
    height: 1280,
    devicePixelRatio: 2,
  },
  {
    id: 'surface-laptop',
    label: 'Surface Laptop',
    category: 'laptop',
    width: 1366,
    height: 768,
    devicePixelRatio: 1,
  },
  {
    id: 'macbook-air-13',
    label: 'MacBook Air 13"',
    category: 'laptop',
    width: 1440,
    height: 900,
    devicePixelRatio: 2,
  },
  {
    id: 'macbook-pro-16',
    label: 'MacBook Pro 16"',
    category: 'laptop',
    width: 1728,
    height: 1117,
    devicePixelRatio: 2,
  },
  {
    id: 'desktop-1280',
    label: 'Desktop 1280',
    category: 'desktop',
    width: 1280,
    height: 800,
    devicePixelRatio: 1,
  },
  {
    id: 'desktop-1440',
    label: 'Laptop 1440',
    category: 'desktop',
    width: 1440,
    height: 900,
    devicePixelRatio: 1,
  },
  {
    id: 'desktop-1080p',
    label: 'Full HD 1080p',
    category: 'desktop',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
  },
  {
    id: 'desktop-1440p',
    label: 'QHD 1440p',
    category: 'desktop',
    width: 2560,
    height: 1440,
    devicePixelRatio: 1,
  },
] as const satisfies readonly ViewportPreset[];

export const VIEWPORT_CATEGORIES = [
  'mobile',
  'tablet',
  'laptop',
  'desktop',
] as const satisfies readonly ViewportCategory[];

/** Quick-fill widths offered in the custom viewport dialog. */
export const VIEWPORT_WIDTH_SHORTCUTS = [
  320, 360, 375, 390, 414, 480, 600, 768, 834, 1024, 1280, 1440, 1536, 1920,
] as const;

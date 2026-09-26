'use client';

import type { ViewportCategory, ViewportPreset } from '@/types/viewport';
import { DevicePresetButton } from './DevicePresetButton';

export const DEVICE_PRESET_GROUP_LABELS: Record<ViewportCategory, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  laptop: 'Laptop',
  desktop: 'Desktop',
  custom: 'Your sizes',
};

export interface DevicePresetListProps {
  readonly category: ViewportCategory;
  readonly presets: readonly ViewportPreset[];
  readonly activePresetId: string | null;
  readonly onSelect: (preset: ViewportPreset) => void;
}

/** One titled group of viewport presets inside the viewport picker. */
export function DevicePresetList({
  category,
  presets,
  activePresetId,
  onSelect,
}: DevicePresetListProps) {
  if (presets.length === 0) return null;

  const label = DEVICE_PRESET_GROUP_LABELS[category];

  return (
    <div className="py-1.5">
      <p className="text-app-subtle px-2 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
        {label}
      </p>
      <ul
        role="listbox"
        aria-label={`${label} viewports`}
        className="space-y-0.5"
      >
        {presets.map((preset) => (
          <li key={preset.id}>
            <DevicePresetButton
              preset={preset}
              active={preset.id === activePresetId}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

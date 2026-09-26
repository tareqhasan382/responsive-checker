'use client';

import { cn } from '@/lib/cn';
import type { ViewportCategory, ViewportPreset } from '@/types/viewport';
import {
  FrameIcon,
  LaptopIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
} from '@/components/ui/icons';

export const CATEGORY_ICONS: Record<ViewportCategory, typeof SmartphoneIcon> = {
  mobile: SmartphoneIcon,
  tablet: TabletIcon,
  laptop: LaptopIcon,
  desktop: MonitorIcon,
  custom: FrameIcon,
};

export interface DevicePresetButtonProps {
  readonly preset: ViewportPreset;
  readonly active: boolean;
  readonly onSelect: (preset: ViewportPreset) => void;
}

export function DevicePresetButton({
  preset,
  active,
  onSelect,
}: DevicePresetButtonProps) {
  const CategoryIcon = CATEGORY_ICONS[preset.category];

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={() => onSelect(preset)}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-150',
        active
          ? 'bg-app-accent/15 text-app-text ring-app-accent/45 ring-1 ring-inset'
          : 'text-app-muted hover:bg-app-elevated hover:text-app-text',
      )}
    >
      <CategoryIcon
        className={cn(
          'shrink-0 text-sm',
          active ? 'text-app-accent' : 'text-app-subtle',
        )}
      />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
        {preset.label}
      </span>
      {preset.devicePixelRatio ? (
        <span className="text-app-subtle shrink-0 text-[10px] tabular-nums">
          {preset.devicePixelRatio}×
        </span>
      ) : null}
      <span className="text-app-subtle shrink-0 font-mono text-[11px] tabular-nums">
        {preset.width}×{preset.height}
      </span>
    </button>
  );
}

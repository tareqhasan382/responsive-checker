'use client';

import { cn } from '@/lib/cn';
import type { ViewportPreset } from '@/types/viewport';
import { formatSize } from '@/utils/viewport';

export interface DeviceChipProps {
  readonly preset: ViewportPreset;
  readonly active: boolean;
  readonly onSelect: (preset: ViewportPreset) => void;
}

/**
 * One preset in the device grid. The size is the primary label because that is
 * what a tester scans for; the device name is the secondary hint.
 */
export function DeviceChip({ preset, active, onSelect }: DeviceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(preset)}
      title={`${preset.label} — ${formatSize(preset)}`}
      className={cn(
        'group flex h-11 min-w-24 flex-col items-start justify-center rounded-md border px-2.5 text-left transition-colors duration-150',
        active
          ? 'border-app-selected-border bg-app-selected-bg text-app-selected-text'
          : 'border-app-border bg-app-elevated text-app-muted hover:border-app-border-strong hover:bg-app-hover hover:text-app-text',
      )}
    >
      <span
        className={cn(
          'font-mono text-xs leading-tight font-medium tabular-nums',
          active && 'text-app-selected-text',
        )}
      >
        {preset.width}×{preset.height}
      </span>
      <span
        className={cn(
          'mt-0.5 max-w-full truncate text-[10px] leading-tight',
          active ? 'text-app-selected-muted' : 'text-app-subtle',
        )}
      >
        {preset.label}
      </span>
    </button>
  );
}

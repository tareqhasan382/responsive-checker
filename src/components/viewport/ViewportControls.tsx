'use client';

import { IconButton } from '@/components/ui/IconButton';
import { ExpandIcon, RotateIcon, ShrinkIcon } from '@/components/ui/icons';
import type { UseViewportResult } from '@/hooks/useViewport';
import { cn } from '@/lib/cn';
import type { HeightMode } from '@/types/viewport';
import { formatSize } from '@/utils/viewport';

export interface ViewportControlsProps {
  readonly viewport: UseViewportResult;
}

const HEIGHT_MODES = [
  { value: 'auto', label: 'Fill available height', icon: ExpandIcon },
  { value: 'fixed', label: 'Use exact device height', icon: ShrinkIcon },
] as const satisfies ReadonlyArray<{
  readonly value: HeightMode;
  readonly label: string;
  readonly icon: typeof ExpandIcon;
}>;

/**
 * Orientation and frame-height controls, plus the current device size.
 *
 * Separate from the device picker: these change *how* the selected device is
 * rendered rather than which device is selected.
 */
export function ViewportControls({ viewport }: ViewportControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="border-app-border bg-app-elevated text-app-muted hidden rounded border px-1.5 py-1 font-mono text-[11px] tabular-nums sm:inline-block">
        {formatSize(viewport.size)}
      </span>

      <IconButton
        label={
          viewport.isRotated ? 'Switch to portrait' : 'Switch to landscape'
        }
        icon={<RotateIcon />}
        aria-pressed={viewport.isRotated}
        className={cn(
          viewport.isRotated &&
            'bg-app-selected-bg text-app-selected-text hover:bg-app-selected-bg',
        )}
        onClick={viewport.rotate}
      />

      <div className="border-app-border bg-app-elevated flex items-center overflow-hidden rounded-md border">
        {HEIGHT_MODES.map((mode) => {
          const active = viewport.heightMode === mode.value;
          return (
            <IconButton
              key={mode.value}
              label={mode.label}
              size="sm"
              icon={<mode.icon />}
              aria-pressed={active}
              className={cn(
                'rounded-none',
                active &&
                  'bg-app-selected-bg text-app-selected-text hover:bg-app-selected-bg',
              )}
              onClick={() => viewport.setHeightMode(mode.value)}
            />
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/Button';
import {
  ExternalLinkIcon,
  ExpandIcon,
  ReloadIcon,
  RotateIcon,
  ShrinkIcon,
} from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import type { UseViewportResult } from '@/hooks/useViewport';
import type { UseZoomResult } from '@/hooks/useZoom';
import type { HeightMode } from '@/types/viewport';
import { cn } from '@/lib/cn';
import { formatSize } from '@/utils/viewport';
import { ViewportSelector } from './ViewportSelector';
import { ZoomControls } from './ZoomControls';

export interface ViewportToolbarProps {
  readonly viewport: UseViewportResult;
  readonly zoom: UseZoomResult;
  readonly target: string | null;
  readonly onReload: () => void;
}

const HEIGHT_MODES = [
  { value: 'auto', label: 'Fill available height', icon: ExpandIcon },
  { value: 'fixed', label: 'Use exact device height', icon: ShrinkIcon },
] as const satisfies ReadonlyArray<{
  readonly value: HeightMode;
  readonly label: string;
  readonly icon: typeof ExpandIcon;
}>;

export function ViewportToolbar({
  viewport,
  zoom,
  target,
  onReload,
}: ViewportToolbarProps) {
  return (
    <div className="border-app-border bg-app-panel flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-2">
      <div className="flex items-center gap-1.5">
        <ViewportSelector viewport={viewport} />

        <IconButton
          label={
            viewport.isRotated ? 'Switch to portrait' : 'Switch to landscape'
          }
          icon={<RotateIcon />}
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
                    'bg-app-accent/15 text-app-accent hover:bg-app-accent/20',
                )}
                onClick={() => viewport.setHeightMode(mode.value)}
              />
            );
          })}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span
          title="Simulated viewport size in CSS pixels"
          className="border-app-border bg-app-canvas text-app-muted hidden rounded border px-1.5 py-1 font-mono text-[11px] tabular-nums sm:inline-block"
        >
          {formatSize(viewport.size)}
        </span>

        <IconButton
          label="Reload the page in the frame"
          icon={<ReloadIcon />}
          disabled={target === null}
          onClick={onReload}
        />

        <Button
          size="sm"
          variant="outline"
          icon={<ExternalLinkIcon />}
          disabled={target === null}
          onClick={() => {
            if (target !== null)
              window.open(target, '_blank', 'noopener,noreferrer');
          }}
        >
          Open
        </Button>

        <ZoomControls zoom={zoom} heightMode={viewport.heightMode} />
      </div>
    </div>
  );
}

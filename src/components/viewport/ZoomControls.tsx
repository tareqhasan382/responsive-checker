'use client';

import { useRef, useState } from 'react';

import { IconButton } from '@/components/ui/IconButton';
import {
  CheckIcon,
  ExpandIcon,
  MinusIcon,
  PlusIcon,
  ShrinkIcon,
} from '@/components/ui/icons';
import { Popover } from '@/components/ui/Popover';
import { cn } from '@/lib/cn';
import type { UseZoomResult } from '@/hooks/useZoom';
import type { HeightMode } from '@/types/viewport';
import { ZOOM_PRESETS } from '@/utils/constants';
import { formatZoom } from '@/utils/viewport';

export interface ZoomControlsProps {
  readonly zoom: UseZoomResult;
  readonly heightMode: HeightMode;
}

const FIT_OPTIONS = [
  { mode: 'width' as const, label: 'Fit width', icon: ExpandIcon },
  { mode: 'screen' as const, label: 'Fit screen', icon: ShrinkIcon },
];

export function ZoomControls({ zoom, heightMode }: ZoomControlsProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // "Fit screen" is meaningless when the frame always fills the pane.
  const screenFitDisabled = heightMode === 'auto';

  return (
    <div className="flex items-center gap-1">
      <div className="border-app-border bg-app-elevated flex items-center overflow-hidden rounded-md border">
        <IconButton
          label="Zoom out"
          size="sm"
          icon={<MinusIcon />}
          disabled={!zoom.canZoomOut}
          onClick={() => zoom.stepZoom(-1)}
        />
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="border-app-border text-app-text hover:bg-app-hover h-7 min-w-16 border-x px-2 font-mono text-[11px] tabular-nums transition-colors duration-150"
        >
          {formatZoom(zoom.zoom)}
        </button>
        <IconButton
          label="Zoom in"
          size="sm"
          icon={<PlusIcon />}
          disabled={!zoom.canZoomIn}
          onClick={() => zoom.stepZoom(1)}
        />
      </div>

      <div className="border-app-border bg-app-elevated flex items-center overflow-hidden rounded-md border">
        {FIT_OPTIONS.map((option) => {
          const active = zoom.mode === option.mode;
          const disabled = option.mode === 'screen' && screenFitDisabled;

          return (
            <IconButton
              key={option.mode}
              label={
                disabled
                  ? 'Fit screen is unavailable while the frame fills the pane'
                  : option.label
              }
              size="sm"
              icon={<option.icon />}
              disabled={disabled}
              aria-pressed={active}
              className={cn(
                'rounded-none',
                active &&
                  'bg-app-accent/15 text-app-accent hover:bg-app-accent/20',
              )}
              onClick={() => zoom.setMode(option.mode)}
            />
          );
        })}
      </div>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        align="center"
        className="w-52 p-1.5"
      >
        <div
          role="menu"
          aria-label="Zoom level"
          className="grid grid-cols-4 gap-1"
        >
          {ZOOM_PRESETS.map((preset) => {
            const active = Math.abs(zoom.zoom - preset) < 0.005;
            return (
              <button
                key={preset}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  zoom.setZoom(preset);
                  setOpen(false);
                }}
                className={cn(
                  'rounded px-1 py-1.5 font-mono text-[11px] tabular-nums transition-colors',
                  active
                    ? 'bg-app-accent/15 text-app-accent'
                    : 'text-app-muted hover:bg-app-elevated hover:text-app-text',
                )}
              >
                {formatZoom(preset)}
              </button>
            );
          })}
          <button
            type="button"
            role="menuitemradio"
            aria-checked={zoom.zoom === 1}
            onClick={() => {
              zoom.setZoom(1);
              setOpen(false);
            }}
            className="text-app-muted hover:bg-app-elevated hover:text-app-text col-span-4 mt-0.5 flex items-center justify-center gap-1.5 rounded px-1 py-1.5 text-[11px] transition-colors"
          >
            {zoom.zoom === 1 ? <CheckIcon className="text-app-accent" /> : null}
            Actual size (100%)
          </button>
        </div>
      </Popover>
    </div>
  );
}

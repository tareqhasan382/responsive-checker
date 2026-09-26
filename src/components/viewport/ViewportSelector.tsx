'use client';

import { useRef, useState } from 'react';

import { DevicePresetList } from '@/components/device/DevicePresetList';
import { CATEGORY_ICONS } from '@/components/device/DevicePresetButton';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon, FrameIcon } from '@/components/ui/icons';
import { Popover } from '@/components/ui/Popover';
import type { UseViewportResult } from '@/hooks/useViewport';
import type { ViewportPreset } from '@/types/viewport';
import { cn } from '@/lib/cn';
import { formatSize } from '@/utils/viewport';
import { CustomViewportDialog } from './CustomViewportDialog';

const GROUP_ORDER = [
  'custom',
  'mobile',
  'tablet',
  'laptop',
  'desktop',
] as const;

export interface ViewportSelectorProps {
  readonly viewport: UseViewportResult;
}

export function ViewportSelector({ viewport }: ViewportSelectorProps) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const grouped = GROUP_ORDER.map((category) => ({
    category,
    presets: viewport.presets.filter((preset) => preset.category === category),
  }));

  const handleSelect = (preset: ViewportPreset) => {
    viewport.selectPreset(preset);
    setOpen(false);
  };

  const ActiveIcon =
    CATEGORY_ICONS[viewport.activePreset?.category ?? 'custom'];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="border-app-border bg-app-elevated text-app-text hover:border-app-border-strong hover:bg-app-hover flex h-9 items-center gap-2 rounded-md border pr-2 pl-3 text-sm transition-colors duration-150"
      >
        <ActiveIcon className="text-app-accent text-sm" />
        <span className="max-w-40 truncate font-medium">
          {viewport.activeLabel}
        </span>
        <span className="text-app-subtle font-mono text-[11px] tabular-nums">
          {formatSize(viewport.size)}
        </span>
        <ChevronDownIcon
          className={cn(
            'text-app-subtle ml-0.5 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        align="start"
        className="w-72 p-1"
      >
        <div role="dialog" aria-label="Choose a viewport">
          {grouped.map(({ category, presets }) => (
            <DevicePresetList
              key={category}
              category={category}
              presets={presets}
              activePresetId={viewport.activePreset?.id ?? null}
              onSelect={handleSelect}
            />
          ))}
        </div>
        <div className="border-app-border bg-app-panel sticky bottom-0 border-t p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            icon={<FrameIcon />}
            onClick={() => {
              setOpen(false);
              setCustomOpen(true);
            }}
          >
            Custom size…
          </Button>
        </div>
      </Popover>

      <CustomViewportDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        currentSize={viewport.baseSize}
        customViewports={viewport.presets.filter(
          (preset) => preset.isCustom === true,
        )}
        onSubmit={(input) => {
          viewport.addCustomViewport(input);
          setCustomOpen(false);
        }}
        onRemove={viewport.removeCustomViewport}
      />
    </>
  );
}

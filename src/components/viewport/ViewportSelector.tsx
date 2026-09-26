'use client';

import { useEffect, useState } from 'react';

import { DeviceChip } from '@/components/device/DeviceChip';
import { Button } from '@/components/ui/Button';
import { FrameIcon } from '@/components/ui/icons';
import {
  VIEWPORT_CATEGORIES,
  VIEWPORT_CATEGORY_LABELS,
} from '@/config/viewport-presets';
import type { UseViewportResult } from '@/hooks/useViewport';
import { cn } from '@/lib/cn';
import type { ViewportCategory, ViewportPreset } from '@/types/viewport';
import { CustomViewportDialog } from './CustomViewportDialog';

/** The categories that have a tab. `custom` sizes get their own saved row. */
type PickerCategory = Exclude<ViewportCategory, 'custom'>;

function isPickerCategory(
  value: ViewportCategory | undefined,
): value is PickerCategory {
  return (
    value === 'mobile' ||
    value === 'tablet' ||
    value === 'desktop' ||
    value === '2k' ||
    value === '4k' ||
    value === 'tv'
  );
}

export interface ViewportSelectorProps {
  readonly viewport: UseViewportResult;
}

/**
 * Device picker: a category filter plus a grid of size chips.
 *
 * The active category is derived from the current selection on first render so
 * that a restored viewport (or a `?url=` deep link) shows the tab it belongs
 * to, then the user is free to browse any other tab.
 */
export function ViewportSelector({ viewport }: ViewportSelectorProps) {
  const initialCategory = viewport.activePreset?.category;
  const [category, setCategory] = useState<PickerCategory>(
    isPickerCategory(initialCategory) ? initialCategory : 'mobile',
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const presetCategory = viewport.activePreset?.category;
    if (isPickerCategory(presetCategory) && presetCategory !== category) {
      setCategory(presetCategory);
    }
  }, [viewport.activePreset?.category, category]);

  const presets = viewport.presets.filter(
    (preset) => preset.category === category,
  );
  const customViewports = viewport.presets.filter(
    (preset) => preset.isCustom === true,
  );

  const handleSelect = (preset: ViewportPreset) => {
    viewport.selectPreset(preset);
  };

  const handleCategoryChange = (option: PickerCategory) => {
    setCategory(option);
    const firstPreset = viewport.presets.find(
      (preset) => preset.category === option,
    );
    if (firstPreset) viewport.selectPreset(firstPreset);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-y-1">
        <div
          role="group"
          aria-label="Device category"
          className="border-app-border bg-app-elevated flex w-full items-center overflow-hidden rounded-md border p-0.5"
        >
          {VIEWPORT_CATEGORIES.map((option) => {
            const active = option === category;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => handleCategoryChange(option)}
                className={cn(
                  'relative h-7 flex-1 rounded px-1.5 text-[11px] font-medium transition-colors duration-120',
                  active
                    ? 'bg-app-selected-bg text-app-selected-text'
                    : 'text-app-muted hover:bg-app-hover hover:text-app-text',
                )}
              >
                {VIEWPORT_CATEGORY_LABELS[option]}
              </button>
            );
          })}
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={<FrameIcon />}
          onClick={() => setDialogOpen(true)}
          className="mt-1 w-full"
        >
          Custom size
        </Button>
      </div>

      <div
        role="group"
        aria-label={`${VIEWPORT_CATEGORY_LABELS[category]} viewports`}
        className="mt-1 flex flex-wrap gap-1"
      >
        {presets.map((preset) => (
          <DeviceChip
            key={preset.id}
            preset={preset}
            active={preset.id === viewport.activePreset?.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {customViewports.length > 0 ? (
        <div
          role="group"
          aria-label="Saved custom viewports"
          className="mt-1 flex flex-wrap items-center gap-1"
        >
          <span className="text-app-subtle pr-0.5 text-[10px] tracking-wide uppercase">
            Saved
          </span>
          {customViewports.map((preset) => (
            <DeviceChip
              key={preset.id}
              preset={preset}
              active={preset.id === viewport.activePreset?.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : null}

      <CustomViewportDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        currentSize={viewport.baseSize}
        customViewports={customViewports}
        onSubmit={(input) => {
          viewport.addCustomViewport(input);
          setDialogOpen(false);
        }}
        onRemove={viewport.removeCustomViewport}
      />
    </>
  );
}

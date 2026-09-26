'use client';

import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';

import { VIEWPORT_WIDTH_SHORTCUTS } from '@/config/viewport-presets';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { AlertIcon, TrashIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import type { Size, ViewportPreset } from '@/types/viewport';
import {
  MAX_VIEWPORT_HEIGHT,
  MAX_VIEWPORT_WIDTH,
  MIN_VIEWPORT_HEIGHT,
  MIN_VIEWPORT_WIDTH,
} from '@/utils/constants';
import { formatSize } from '@/utils/viewport';

export interface CustomViewportDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly currentSize: Size;
  readonly customViewports: readonly ViewportPreset[];
  readonly onSubmit: (input: {
    readonly label: string;
    readonly width: number;
    readonly height: number;
  }) => void;
  readonly onRemove: (id: string) => void;
}

function parseDimension(raw: string): number | null {
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function validateDimension(
  value: number | null,
  label: string,
  min: number,
  max: number,
): string | undefined {
  if (value === null) return `Enter a ${label.toLowerCase()} in pixels.`;
  if (value < min || value > max)
    return `${label} must be between ${min} and ${max}px.`;
  return undefined;
}

export function CustomViewportDialog({
  open,
  onClose,
  currentSize,
  customViewports,
  onSubmit,
  onRemove,
}: CustomViewportDialogProps) {
  const [label, setLabel] = useState('');
  const [width, setWidth] = useState(() => String(currentSize.width));
  const [height, setHeight] = useState(() => String(currentSize.height));
  const labelId = useId();

  // Re-seed the form from the current viewport each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setLabel('');
    setWidth(String(currentSize.width));
    setHeight(String(currentSize.height));
  }, [currentSize.height, currentSize.width, open]);

  const parsedWidth = parseDimension(width);
  const parsedHeight = parseDimension(height);
  const widthError = validateDimension(
    parsedWidth,
    'Width',
    MIN_VIEWPORT_WIDTH,
    MAX_VIEWPORT_WIDTH,
  );
  const heightError = validateDimension(
    parsedHeight,
    'Height',
    MIN_VIEWPORT_HEIGHT,
    MAX_VIEWPORT_HEIGHT,
  );
  const isValid = widthError === undefined && heightError === undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || parsedWidth === null || parsedHeight === null) return;
    onSubmit({ label, width: parsedWidth, height: parsedHeight });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Custom viewport"
      description="Test a specific breakpoint. Saved sizes are stored in this browser only."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="custom-viewport-form"
            disabled={!isValid}
          >
            Save size
          </Button>
        </>
      }
    >
      <form
        id="custom-viewport-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor={`${labelId}-label`}
            className="text-app-muted mb-1.5 block text-xs font-medium"
          >
            Name <span className="text-app-subtle">(optional)</span>
          </label>
          <Input
            id={`${labelId}-label`}
            value={label}
            placeholder="e.g. Marketing hero"
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`${labelId}-width`}
              className="text-app-muted mb-1.5 block text-xs font-medium"
            >
              Width (px)
            </label>
            <Input
              id={`${labelId}-width`}
              type="number"
              inputMode="numeric"
              min={MIN_VIEWPORT_WIDTH}
              max={MAX_VIEWPORT_WIDTH}
              value={width}
              invalid={widthError !== undefined}
              aria-describedby={
                widthError ? `${labelId}-width-error` : undefined
              }
              onChange={(event) => setWidth(event.target.value)}
            />
            {widthError ? (
              <FieldError id={`${labelId}-width-error`}>
                {widthError}
              </FieldError>
            ) : null}
          </div>

          <div>
            <label
              htmlFor={`${labelId}-height`}
              className="text-app-muted mb-1.5 block text-xs font-medium"
            >
              Height (px)
            </label>
            <Input
              id={`${labelId}-height`}
              type="number"
              inputMode="numeric"
              min={MIN_VIEWPORT_HEIGHT}
              max={MAX_VIEWPORT_HEIGHT}
              value={height}
              invalid={heightError !== undefined}
              aria-describedby={
                heightError ? `${labelId}-height-error` : undefined
              }
              onChange={(event) => setHeight(event.target.value)}
            />
            {heightError ? (
              <FieldError id={`${labelId}-height-error`}>
                {heightError}
              </FieldError>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-app-muted mb-1.5 text-xs font-medium">
            Common widths
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VIEWPORT_WIDTH_SHORTCUTS.map((shortcut) => (
              <button
                key={shortcut}
                type="button"
                onClick={() => setWidth(String(shortcut))}
                className={cn(
                  'h-7 rounded border px-1.5 font-mono text-[11px] tabular-nums transition-colors',
                  Number(width) === shortcut
                    ? 'border-app-selected-border bg-app-selected-bg text-app-selected-text'
                    : 'border-app-border text-app-subtle hover:border-app-border-strong hover:text-app-text',
                )}
              >
                {shortcut}
              </button>
            ))}
          </div>
        </div>

        {customViewports.length > 0 ? (
          <div>
            <p className="text-app-muted mb-1.5 text-xs font-medium">
              Saved sizes
            </p>
            <ul className="space-y-1">
              {customViewports.map((preset) => (
                <li
                  key={preset.id}
                  className="border-app-border bg-app-canvas/50 flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {preset.label}
                  </span>
                  <span className="text-app-subtle font-mono text-[11px] tabular-nums">
                    {formatSize(preset)}
                  </span>
                  <IconButton
                    label={`Delete ${preset.label}`}
                    size="sm"
                    icon={<TrashIcon />}
                    onClick={() => onRemove(preset.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}

function FieldError({
  id,
  children,
}: {
  readonly id: string;
  readonly children: string;
}) {
  return (
    <p
      id={id}
      role="alert"
      className="text-app-danger mt-1.5 flex items-center gap-1 text-[11px]"
    >
      <AlertIcon className="shrink-0" />
      {children}
    </p>
  );
}

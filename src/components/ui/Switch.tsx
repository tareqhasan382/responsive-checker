'use client';

import { cn } from '@/lib/cn';

export interface SwitchProps {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly label: string;
  /** Renders the description under the label when set. */
  readonly hint?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Compact switch used for settings that change how the preview behaves rather
 * than what it shows. Built on a native checkbox so keyboard and screen-reader
 * behaviour come for free.
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  hint,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        'group inline-flex items-start gap-2',
        disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
        className,
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          'border-app-border relative mt-px h-4 w-7 shrink-0 rounded-full border transition-colors duration-150',
          'peer-focus-visible:ring-app-accent/60 peer-focus-visible:ring-2',
          checked ? 'border-app-accent bg-app-accent' : 'bg-app-elevated',
        )}
      >
        <span
          className={cn(
            'bg-app-panel absolute top-0.5 left-0.5 size-2.5 rounded-full shadow-sm transition-transform duration-150',
            checked && 'translate-x-3',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="text-app-muted group-hover:text-app-text block text-[11px] leading-tight font-medium transition-colors">
          {label}
        </span>
        {hint !== undefined ? (
          <span className="text-app-subtle mt-0.5 block text-[10.5px] leading-snug">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { Tooltip } from './Tooltip';

export type IconButtonVariant = 'ghost' | 'solid' | 'outline';
export type IconButtonSize = 'sm' | 'md';

const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-md transition-[background-color,color,border-color,opacity] ' +
  'duration-150 disabled:pointer-events-none disabled:opacity-40 select-none';

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: 'text-app-muted hover:bg-app-elevated hover:text-app-text',
  solid: 'bg-app-elevated text-app-text hover:bg-app-hover',
  outline:
    'border border-app-border text-app-muted hover:bg-app-elevated hover:text-app-text',
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'size-7 text-sm',
  md: 'size-9 text-base',
};

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> {
  /** Required: icon-only controls must expose an accessible name. */
  readonly label: string;
  readonly icon: ReactNode;
  readonly variant?: IconButtonVariant;
  readonly size?: IconButtonSize;
  /** Set to `false` to disable the tooltip, e.g. when the label is already visible. */
  readonly tooltip?: boolean;
  readonly tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip = true,
  tooltipSide = 'bottom',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type={type}
      aria-label={label}
      className={cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip label={label} side={tooltipSide}>
      {button}
    </Tooltip>
  );
}

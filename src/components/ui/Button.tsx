import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant =
  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,opacity,box-shadow] duration-120 ease-out ' +
  'disabled:pointer-events-none disabled:opacity-45 select-none';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-app-accent text-app-accent-contrast hover:bg-app-accent-strong ' +
    'active:bg-app-accent',
  secondary:
    'bg-app-panel text-app-text border border-app-border ' +
    'hover:bg-app-hover hover:border-app-border-strong',
  outline:
    'border border-app-border bg-transparent text-app-muted ' +
    'hover:border-app-border-strong hover:bg-app-elevated hover:text-app-text',
  ghost:
    'text-app-muted hover:bg-app-hover hover:text-app-text',
  danger:
    'bg-transparent text-app-danger border border-app-border ' +
    'hover:bg-app-danger/10 hover:border-app-danger/50',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-[11px]',
  md: 'h-8 px-3 text-xs',
  lg: 'h-9 px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Rendered before the label and inherits the current font size. */
  readonly icon?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

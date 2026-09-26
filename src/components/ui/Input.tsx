import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  readonly invalid?: boolean;
  /** Rendered before the field, e.g. a protocol hint. */
  readonly leading?: ReactNode;
  readonly inputSize?: 'sm' | 'md';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, leading, inputSize = 'md', ...props },
  ref,
) {
  return (
    <div
      className={cn(
        'group bg-app-canvas/60 flex w-full items-center gap-2 rounded-md border',
        'transition-colors duration-150',
        'focus-within:border-app-accent focus-within:ring-app-accent/25 focus-within:ring-2',
        invalid
          ? 'border-app-danger/70'
          : 'border-app-border hover:border-app-border-strong',
        inputSize === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-sm',
        className,
      )}
    >
      {leading ? (
        <span className="text-app-subtle group-focus-within:text-app-accent shrink-0 transition-colors">
          {leading}
        </span>
      ) : null}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className="text-app-text placeholder:text-app-subtle min-w-0 flex-1 bg-transparent outline-none"
        {...props}
      />
    </div>
  );
});

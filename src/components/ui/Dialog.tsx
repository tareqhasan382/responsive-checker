'use client';

import { useEffect, useId, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { CloseIcon } from './icons';
import { IconButton } from './IconButton';

export interface DialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly className?: string;
}

/**
 * Modal dialog built on the native `<dialog>` element, which gives us focus
 * trapping, inert background content and Escape handling from the platform.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;

    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      className={cn(
        'rt-dialog border-app-border m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl border',
        'bg-app-panel text-app-text backdrop:bg-app-canvas/70 p-0 shadow-2xl',
        className,
      )}
    >
      <div className="border-app-border flex items-start justify-between gap-4 border-b px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p
              id={descriptionId}
              className="text-app-muted mt-1 text-xs leading-relaxed"
            >
              {description}
            </p>
          ) : null}
        </div>
        <IconButton
          label="Close dialog"
          size="sm"
          icon={<CloseIcon />}
          onClick={onClose}
        />
      </div>

      <div className="px-5 py-4">{children}</div>

      {footer ? (
        <div className="border-app-border bg-app-canvas/40 flex items-center justify-end gap-2 border-t px-5 py-3">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

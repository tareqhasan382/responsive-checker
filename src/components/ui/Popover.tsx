'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

const GUTTER = 8;
const VIEWPORT_MARGIN = 8;

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface PanelPosition {
  readonly top: number;
  readonly left: number;
}

export interface PopoverProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly anchorRef: RefObject<HTMLElement | null>;
  readonly align?: 'start' | 'center' | 'end';
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Portal-rendered panel anchored to a trigger element.
 *
 * Rendering into `document.body` keeps dropdowns out of the preview pane's
 * scroll container, and measuring the live trigger rect keeps them aligned when
 * the toolbar reflows. Height is capped with CSS rather than JS so the
 * flip-above/flip-below decision is never measured against its own result.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  align = 'start',
  className,
  children,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PanelPosition | null>(null);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current?.getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    if (!anchor || !panel) return;

    const spaceBelow =
      window.innerHeight - anchor.bottom - GUTTER - VIEWPORT_MARGIN;
    const spaceAbove = anchor.top - GUTTER - VIEWPORT_MARGIN;
    const flip = spaceBelow < panel.height && spaceAbove > spaceBelow;

    const top = flip
      ? Math.max(VIEWPORT_MARGIN, anchor.top - GUTTER - panel.height)
      : Math.min(anchor.bottom + GUTTER, window.innerHeight - VIEWPORT_MARGIN);

    const rawLeft =
      align === 'end'
        ? anchor.right - panel.width
        : align === 'center'
          ? anchor.left + anchor.width / 2 - panel.width / 2
          : anchor.left;

    setPosition({
      top,
      left: Math.min(
        Math.max(rawLeft, VIEWPORT_MARGIN),
        Math.max(
          VIEWPORT_MARGIN,
          window.innerWidth - panel.width - VIEWPORT_MARGIN,
        ),
      ),
    });
  }, [align, anchorRef]);

  useIsomorphicLayoutEffect(() => {
    if (open) reposition();
    else setPosition(null);
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [anchorRef, onClose, open, reposition]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={
        position
          ? { top: position.top, left: position.left }
          : { top: 0, left: 0, visibility: 'hidden' }
      }
      className={cn(
        'fixed z-50 max-h-[min(28rem,70vh)] overflow-y-auto overscroll-contain',
        'border-app-border bg-app-panel scrollbar-slim rounded-lg border shadow-2xl',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

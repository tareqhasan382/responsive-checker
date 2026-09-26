'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

type Side = 'top' | 'bottom' | 'left' | 'right';

const VIEWPORT_MARGIN = 4;
const TRIGGER_GAP = 8;

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface BubblePosition {
  readonly top: number;
  readonly left: number;
}

function resolvePosition(
  trigger: DOMRect,
  bubble: DOMRect,
  side: Side,
): BubblePosition {
  let top: number;
  let left: number;

  if (side === 'top' || side === 'bottom') {
    left = trigger.left + trigger.width / 2 - bubble.width / 2;
    top =
      side === 'top'
        ? trigger.top - bubble.height - TRIGGER_GAP
        : trigger.bottom + TRIGGER_GAP;

    // Flip to the other side when the preferred one would leave the viewport.
    if (top < VIEWPORT_MARGIN) {
      top = trigger.bottom + TRIGGER_GAP;
    } else if (top + bubble.height > window.innerHeight - VIEWPORT_MARGIN) {
      top = trigger.top - bubble.height - TRIGGER_GAP;
    }
  } else {
    top = trigger.top + trigger.height / 2 - bubble.height / 2;
    left =
      side === 'left'
        ? trigger.left - bubble.width - TRIGGER_GAP
        : trigger.right + TRIGGER_GAP;

    if (left < VIEWPORT_MARGIN) {
      left = trigger.right + TRIGGER_GAP;
    } else if (left + bubble.width > window.innerWidth - VIEWPORT_MARGIN) {
      left = trigger.left - bubble.width - TRIGGER_GAP;
    }
  }

  return {
    top: Math.min(
      Math.max(top, VIEWPORT_MARGIN),
      window.innerHeight - bubble.height - VIEWPORT_MARGIN,
    ),
    left: Math.min(
      Math.max(left, VIEWPORT_MARGIN),
      window.innerWidth - bubble.width - VIEWPORT_MARGIN,
    ),
  };
}

export interface TooltipProps {
  readonly label: string;
  readonly children: ReactElement;
  readonly side?: Side;
  readonly delayMs?: number;
}

/**
 * Portal-rendered tooltip. Portalling keeps the bubble visible inside preview
 * areas that clip their overflow, and the position is measured from the live
 * trigger rect so the labels never drift from their control.
 */
export function Tooltip({
  label,
  children,
  side = 'top',
  delayMs = 350,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<BubblePosition | null>(null);

  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimer();
    setOpen(false);
    setPosition(null);
  }, [clearTimer]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const bubble = bubbleRef.current?.getBoundingClientRect();
    if (!trigger || !bubble) return;
    setPosition(resolvePosition(trigger, bubble, side));
  }, [side]);

  useIsomorphicLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const dismiss = () => close();
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    window.addEventListener('blur', dismiss);

    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('blur', dismiss);
    };
  }, [close, open]);

  useEffect(() => clearTimer, [clearTimer]);

  const show = useCallback(
    (immediate: boolean) => {
      clearTimer();
      if (immediate) {
        setOpen(true);
        return;
      }
      timerRef.current = setTimeout(() => setOpen(true), delayMs);
    },
    [clearTimer, delayMs],
  );

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      if (event.pointerType === 'touch') return;
      show(false);
    },
    [show],
  );

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        aria-describedby={open ? id : undefined}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={close}
        onPointerCancel={close}
        onFocus={() => show(true)}
        onBlur={close}
      >
        {children}
      </span>

      {open && position
        ? createPortal(
            <div
              ref={bubbleRef}
              id={id}
              role="tooltip"
              style={{ top: position.top, left: position.left }}
              className={cn(
                'border-app-border pointer-events-none fixed z-50 max-w-64 rounded-md border',
                'bg-app-elevated text-app-text px-2 py-1 text-xs leading-snug shadow-lg',
              )}
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

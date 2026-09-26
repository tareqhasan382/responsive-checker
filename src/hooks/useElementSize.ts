'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import type { Size } from '@/types/viewport';

export interface ElementSizeResult<T extends HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly size: Size;
  /** `false` until the first measurement, so consumers can avoid a 0×0 layout. */
  readonly measured: boolean;
}

/**
 * Observes an element's content box. Used by the preview pane to work out how
 * much room the device frame gets before deciding on a scale factor.
 */
export function useElementSize<T extends HTMLElement>(): ElementSizeResult<T> {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const apply = (width: number, height: number) => {
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);
      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    };

    apply(node.clientWidth, node.clientHeight);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      apply(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, size, measured: size.width > 0 && size.height > 0 };
}

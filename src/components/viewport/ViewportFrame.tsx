'use client';

import { useEffect, useState } from 'react';

import type { FrameStatus } from '@/types/app';
import type { Size } from '@/types/viewport';
import { FRAME_LOAD_TIMEOUT_MS } from '@/utils/constants';

export interface ViewportFrameProps {
  readonly src: string;
  /** Logical size in CSS pixels. The target's media queries read this, not the zoom. */
  readonly content: Size;
  readonly zoom: number;
  /** Bump to force a fresh load of the same URL. */
  readonly reloadKey: number;
  readonly onStatusChange: (status: FrameStatus) => void;
}

/**
 * The device frame.
 *
 * The document is always laid out at `content` and then scaled with a CSS
 * transform, so the target sees a real viewport of exactly `content.width`
 * pixels — media queries, `vw` units and layout all behave as if the window
 * were that size, which a CSS-resized iframe cannot achieve.
 *
 * The `sandbox` token list is deliberately permissive so real sites work. It
 * omits `allow-top-navigation`, so a framed page can never navigate the
 * tester away.
 */
export function ViewportFrame({
  src,
  content,
  zoom,
  reloadKey,
  onStatusChange,
}: ViewportFrameProps) {
  const [status, setStatus] = useState<FrameStatus>('loading');

  useEffect(() => {
    setStatus('loading');
  }, [src, reloadKey]);

  useEffect(() => {
    if (status !== 'loading') return;

    const timer = setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'stalled' : current));
    }, FRAME_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [status, src, reloadKey]);

  useEffect(() => {
    onStatusChange(status);
  }, [onStatusChange, status]);

  return (
    <iframe
      key={`${src}#${reloadKey}`}
      src={src}
      title="Target page preview"
      onLoad={() => setStatus('ready')}
      onError={() => setStatus('error')}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
      // Intrinsic attributes as well as CSS, so the document is the right size
      // even before styles are applied and assistive tech can read it.
      width={content.width}
      height={content.height}
      style={{
        width: `${content.width}px`,
        height: `${content.height}px`,
        transform: `scale(${zoom})`,
      }}
      className="absolute top-0 left-0 origin-top-left border-0 bg-white"
    />
  );
}

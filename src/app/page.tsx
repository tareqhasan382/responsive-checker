'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { UrlInput } from '@/components/url/UrlInput';
import { ViewportPreview } from '@/components/viewport/ViewportPreview';
import { ViewportToolbar } from '@/components/viewport/ViewportToolbar';
import { useElementSize } from '@/hooks/useElementSize';
import { useTargetUrl } from '@/hooks/useTargetUrl';
import { useViewport } from '@/hooks/useViewport';
import { useZoom } from '@/hooks/useZoom';
import { PREVIEW_GUTTER } from '@/utils/constants';
import { deriveFrameGeometry, formatSize, formatZoom } from '@/utils/viewport';
import { formatUrlForDisplay } from '@/utils/url';

export default function HomePage() {
  const url = useTargetUrl();
  const viewport = useViewport();
  const pane = useElementSize<HTMLDivElement>();
  const [reloadKey, setReloadKey] = useState(0);

  const available = useMemo(
    () => ({
      width: Math.max(0, pane.size.width - PREVIEW_GUTTER * 2),
      height: Math.max(0, pane.size.height - PREVIEW_GUTTER * 2),
    }),
    [pane.size],
  );

  const zoom = useZoom({
    available,
    content: viewport.size,
    heightMode: viewport.heightMode,
  });

  const frame = useMemo(
    () =>
      deriveFrameGeometry({
        viewportSize: viewport.size,
        heightMode: viewport.heightMode,
        available,
        zoom: zoom.zoom,
      }),
    [available, viewport.heightMode, viewport.size, zoom.zoom],
  );

  const handleReload = useCallback(
    () => setReloadKey((current) => current + 1),
    [],
  );

  useEffect(() => {
    if (url.target === null) return;
    const next = new URL(window.location.href);
    next.searchParams.set('url', url.target);
    window.history.replaceState(null, '', next);
  }, [url.target]);

  return (
    <AppShell
      status={
        <>
          <span className="text-app-muted font-mono">
            {url.target === null
              ? 'No target loaded'
              : formatUrlForDisplay(url.target)}
          </span>
          <span>
            Frame{' '}
            <span className="text-app-muted font-mono">
              {formatSize(frame.content)}
            </span>
          </span>
          <span>
            Zoom{' '}
            <span className="text-app-muted font-mono">
              {formatZoom(zoom.zoom)}
            </span>
          </span>
          <span className="ml-auto">
            {viewport.heightMode === 'auto'
              ? `Frame height fills the pane instead of the device's ${viewport.size.height}px.`
              : 'Frame height matches the device exactly.'}
          </span>
        </>
      }
    >
      <UrlInput
        value={url.input}
        error={url.error}
        onChange={url.setInput}
        onSubmit={url.submit}
      />

      <ViewportToolbar
        viewport={viewport}
        zoom={zoom}
        target={url.target}
        onReload={handleReload}
      />

      <div ref={pane.ref} className="flex min-h-0 flex-1 flex-col">
        <ViewportPreview
          target={url.target}
          content={frame.content}
          display={frame.display}
          zoom={zoom.zoom}
          reloadKey={reloadKey}
          measured={pane.measured}
          onReload={handleReload}
        />
      </div>
    </AppShell>
  );
}

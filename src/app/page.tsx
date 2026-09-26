'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ReloadIcon,
  TestIcon,
} from '@/components/ui/icons';
import { ViewportControls } from '@/components/viewport/ViewportControls';
import { ViewportPreview } from '@/components/viewport/ViewportPreview';
import { ViewportSelector } from '@/components/viewport/ViewportSelector';
import { ZoomControls } from '@/components/viewport/ZoomControls';
import { useElementSize } from '@/hooks/useElementSize';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useTargetUrl } from '@/hooks/useTargetUrl';
import { useViewport } from '@/hooks/useViewport';
import { useZoom } from '@/hooks/useZoom';
import { PREVIEW_GUTTER } from '@/utils/constants';
import { deriveFrameGeometry, formatSize } from '@/utils/viewport';

/** True when the user is typing, so single-letter shortcuts stay out of the way. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export default function HomePage() {
  const url = useTargetUrl();
  const viewport = useViewport();
  const pane = useElementSize<HTMLDivElement>();
  const [reloadKey, setReloadKey] = useState(0);
  const sidebarCollapsed = usePersistentState(
    'sidebar-collapsed',
    false,
    isBoolean,
  );

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

  // Mirror the target into ?url= so the current preview can be shared or
  // reloaded. replaceState keeps it out of the session history.
  useEffect(() => {
    if (url.target === null) return;
    const next = new URL(window.location.href);
    next.searchParams.set('url', url.target);
    window.history.replaceState(null, '', next);
  }, [url.target]);

  // `r` reloads the frame, but only when the user is not typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== 'r') return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      handleReload();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleReload]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    url.submit();
  };

  const collapsed = sidebarCollapsed.value;
  const toggleSidebar = () =>
    sidebarCollapsed.setValue((current) => !current);

  return (
    <AppShell
      headerContent={
        <form onSubmit={handleSubmit} noValidate className="mx-2 flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <label className="sr-only">Website URL to test</label>
            <Input
              value={url.input}
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              placeholder="example.com, localhost:3000 …"
              leading={<GlobeIcon className="text-base" />}
              invalid={url.error !== null}
              onChange={(event) => url.setInput(event.target.value)}
              className="h-9"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            icon={<TestIcon />}
            className="h-9 shrink-0"
          >
            Test
          </Button>
        </form>
      }
    >
      <div className="flex min-h-0 flex-1">
        <aside
          className={
            collapsed
              ? 'border-app-border bg-app-panel shrink-0 border-r w-14'
              : 'border-app-border bg-app-panel shrink-0 overflow-y-auto border-r w-72'
          }
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-3 p-2.5">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand device sidebar"
                title="Expand device sidebar"
                className="group border-app-border bg-app-canvas text-app-muted hover:border-app-accent hover:text-app-accent flex size-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border shadow-sm transition-all duration-150 hover:shadow-md"
              >
                <ChevronRightIcon className="text-sm leading-none" />
                <span className="text-[8px] font-semibold leading-none tracking-wide">
                  DEV
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-app-selected-bg text-app-selected-text flex size-7 items-center justify-center rounded-lg">
                    <ChevronRightIcon className="text-sm" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-app-text text-sm font-semibold leading-tight">
                      Devices
                    </span>
                    <span className="text-app-subtle text-[10px] leading-tight">
                      {viewport.activeLabel}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Collapse device sidebar"
                  title="Collapse device sidebar"
                  className="group border-app-border bg-app-canvas text-app-muted hover:border-app-accent hover:text-app-accent flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium shadow-sm transition-all duration-150 hover:shadow-md"
                >
                  <ChevronLeftIcon className="text-sm leading-none" />
                  <span>Hide</span>
                </button>
              </div>

              <ViewportSelector viewport={viewport} />

              <div className="border-app-border border-t pt-3">
                <ViewportControls viewport={viewport} />
              </div>

              <div className="border-app-border border-t pt-3">
                <h3 className="text-app-subtle mb-1.5 text-[11px] font-medium tracking-wide uppercase">
                  Zoom
                </h3>
                <ZoomControls zoom={zoom} heightMode={viewport.heightMode} />
              </div>

              <div className="border-app-border border-t pt-3">
                <h3 className="text-app-subtle mb-1.5 text-[11px] font-medium tracking-wide uppercase">
                  Actions
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border-app-border bg-app-elevated text-app-muted rounded-lg border px-2 py-1 font-mono text-[11px] tabular-nums">
                    {formatSize(viewport.size)}
                  </span>
                  <IconButton
                    label="Reload the page in the frame (R)"
                    icon={<ReloadIcon />}
                    disabled={url.target === null}
                    onClick={handleReload}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ExternalLinkIcon />}
                    disabled={url.target === null}
                    onClick={() => {
                      if (url.target !== null)
                        window.open(url.target, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Open
                  </Button>
                </div>
              </div>
            </div>
          )}
        </aside>

        <div ref={pane.ref} className="flex min-w-0 flex-1 flex-col">
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
      </div>
    </AppShell>
  );
}

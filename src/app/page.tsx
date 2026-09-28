'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { SidebarAuthorCard } from '@/components/layout/SidebarAuthorCard';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ReloadIcon,
  TestIcon,
} from '@/components/ui/icons';
import { FramingHelpDialog } from '@/components/viewport/FramingHelpDialog';
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
import {
  deriveFrameGeometry,
  derivePresentationGeometry,
  formatSize,
} from '@/utils/viewport';

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
  const [framingHelpOpen, setFramingHelpOpen] = useState(false);
  const openFramingHelp = useCallback(() => setFramingHelpOpen(true), []);
  const sidebarCollapsed = usePersistentState(
    'sidebar-collapsed',
    false,
    isBoolean,
  );
  const forceEmbed = usePersistentState('force-embed', false, isBoolean);

  const presentationGeometry = useMemo(
    () =>
      derivePresentationGeometry({
        viewportSize: viewport.size,
        category: viewport.activePreset?.category,
      }),
    [viewport.activePreset?.category, viewport.size],
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
    presentation: presentationGeometry.presentation,
  });

  const frame = useMemo(
    () =>
      deriveFrameGeometry({
        viewportSize: viewport.size,
        heightMode: viewport.heightMode,
        available,
        zoom: zoom.zoom,
        category: viewport.activePreset?.category,
      }),
    [available, viewport.activePreset?.category, viewport.heightMode, viewport.size, zoom.zoom],
  );

  const handleReload = useCallback(
    () => setReloadKey((current) => current + 1),
    [],
  );

  /*
   * Force embed routes the frame through /api/embed, which re-serves the
   * document without the headers that make a browser refuse to frame it. The
   * real target is kept alongside it so "Open in new tab" still goes to the
   * site itself rather than to the proxy.
   */
  const frameSrc = useMemo(() => {
    if (url.target === null) return null;
    if (!forceEmbed.value) return url.target;
    return `/api/embed?url=${encodeURIComponent(url.target)}`;
  }, [url.target, forceEmbed.value]);

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
  const toggleSidebar = () => sidebarCollapsed.setValue((current) => !current);

  return (
    <AppShell
      headerContent={
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mx-0.5 flex min-w-0 items-center gap-1 sm:mx-1.5 sm:gap-1.5"
        >
          <div className="min-w-0 flex-1">
            <label className="sr-only">Website URL to test</label>
            <Input
              value={url.input}
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              placeholder="example.com, localhost:3000 …"
              leading={<GlobeIcon className="text-sm" />}
              invalid={url.error !== null}
              onChange={(event) => url.setInput(event.target.value)}
              className="h-7"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={<TestIcon />}
            className="h-7 shrink-0"
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
              ? 'border-app-border bg-app-panel flex w-10 shrink-0 flex-col border-r'
              : 'border-app-border bg-app-panel flex w-64 shrink-0 flex-col border-r'
          }
        >
          {collapsed ? (
            <>
              <div className="flex flex-col items-center gap-2 p-1.5">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label="Expand device sidebar"
                  title="Expand device sidebar"
                  className="group border-app-border bg-app-canvas text-app-muted hover:border-app-accent hover:text-app-accent flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-150"
                >
                  <ChevronRightIcon className="text-[13px]" />
                </button>
              </div>

              <div className="mt-auto flex justify-center p-1.5">
                <SidebarAuthorCard collapsed />
              </div>
            </>
          ) : (
            <>
              <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-2.5 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span
                        className="text-app-accent-contrast flex size-6 shrink-0 items-center justify-center rounded-md"
                        style={{
                          backgroundImage:
                            'linear-gradient(135deg, var(--app-accent), var(--app-accent-strong))',
                        }}
                      >
                        <ChevronRightIcon className="text-[12px]" />
                      </span>
                      <div className="min-w-0 flex-1 flex-col">
                        <span className="text-app-text truncate text-[12px] leading-tight font-semibold tracking-tight">
                          Devices
                        </span>
                        <span className="text-app-subtle truncate text-[10px] leading-tight">
                          {viewport.activeLabel}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      aria-label="Collapse device sidebar"
                      title="Collapse device sidebar"
                      className="group border-app-border bg-app-canvas text-app-muted hover:border-app-accent hover:text-app-accent flex shrink-0 items-center gap-0.5 rounded-md border px-1.5 py-1 text-[10.5px] font-medium transition-colors duration-150"
                    >
                      <ChevronLeftIcon className="text-[12px]" />
                    </button>
                  </div>

                  <ViewportSelector viewport={viewport} />

                  <div className="border-app-border border-t pt-2">
                    <ViewportControls viewport={viewport} />
                  </div>

                  <div className="border-app-border border-t pt-2">
                    <h3 className="text-app-subtle mb-1 text-[10.5px] font-medium tracking-wide uppercase">
                      Zoom
                    </h3>
                    <ZoomControls
                      zoom={zoom}
                      heightMode={viewport.heightMode}
                    />
                  </div>

                  <div className="border-app-border border-t pt-2">
                    <h3 className="text-app-subtle mb-1 text-[10.5px] font-medium tracking-wide uppercase">
                      Actions
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="border-app-border bg-app-elevated text-app-muted rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums">
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
                            window.open(
                              url.target,
                              '_blank',
                              'noopener,noreferrer',
                            );
                        }}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={url.target === null}
                        onClick={openFramingHelp}
                      >
                        Frame not showing?
                      </Button>
                    </div>

                    <Switch
                      className="mt-1.5"
                      checked={forceEmbed.value}
                      onCheckedChange={forceEmbed.setValue}
                      label="Force embed"
                      hint="Re-serve sites that block framing. Best for static and server-rendered pages."
                    />
                  </div>
                </div>
              </div>

              <SidebarAuthorCard />
            </>
          )}
        </aside>

        <div ref={pane.ref} className="flex min-w-0 flex-1 flex-col">
          <ViewportPreview
            target={url.target}
            src={frameSrc}
            content={frame.content}
            display={frame.display}
            presentation={frame.presentation}
            fittedPresentation={frame.fittedPresentation}
            viewportInPresentation={frame.viewportInPresentation}
            zoom={zoom.zoom}
            effectiveScale={zoom.zoom}
            category={viewport.activePreset?.category}
            reloadKey={reloadKey}
            measured={pane.measured}
            onReload={handleReload}
            onDiagnose={openFramingHelp}
          />
        </div>
      </div>

      <FramingHelpDialog
        open={framingHelpOpen}
        onClose={() => setFramingHelpOpen(false)}
        target={url.target}
      />
    </AppShell>
  );
}

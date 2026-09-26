'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';
import {
  AlertIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ReloadIcon,
} from '@/components/ui/icons';
import type { FrameStatus } from '@/types/app';
import type { Size } from '@/types/viewport';
import { PREVIEW_GUTTER } from '@/utils/constants';
import { ViewportFrame } from './ViewportFrame';

export interface ViewportPreviewProps {
  readonly target: string | null;
  /** Logical size the target page sees, in CSS pixels. */
  readonly content: Size;
  /** On-screen size after zoom scaling. */
  readonly display: Size;
  readonly zoom: number;
  readonly reloadKey: number;
  /** `false` until the pane has been measured, so no mis-scaled frame is painted. */
  readonly measured: boolean;
  readonly onReload: () => void;
}

type BlockingStatus = Exclude<FrameStatus, 'empty' | 'ready'>;

const STATUS_MESSAGES: Record<BlockingStatus, string> = {
  loading: 'Loading the page…',
  error:
    'The page could not be loaded. Check the URL and that the site is running.',
  stalled:
    'Still loading after a few seconds. Sites that send an X-Frame-Options or frame-ancestors CSP header refuse to be embedded — open the target in a new tab to confirm.',
};

export function ViewportPreview({
  target,
  content,
  display,
  zoom,
  reloadKey,
  measured,
  onReload,
}: ViewportPreviewProps) {
  const [status, setStatus] = useState<FrameStatus>('empty');
  const handleStatusChange = useCallback(
    (next: FrameStatus) => setStatus(next),
    [],
  );

  const blocking: BlockingStatus | null =
    status === 'loading' || status === 'error' || status === 'stalled'
      ? status
      : null;

  return (
    <div className="preview-grid scrollbar-slim relative flex-1 overflow-auto overscroll-contain">
      <div
        className="flex min-h-full min-w-full items-center justify-center"
        style={{ padding: PREVIEW_GUTTER }}
      >
        {!measured ? (
          <Skeleton />
        ) : target === null ? (
          <EmptyState />
        ) : (
          <div
            className="relative shrink-0"
            style={{ width: display.width, height: display.height }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: content.width,
                height: content.height,
                transform: `scale(${zoom})`,
              }}
            >
              <ViewportFrame
                src={target}
                content={content}
                zoom={zoom}
                reloadKey={reloadKey}
                onStatusChange={handleStatusChange}
              />
            </div>

            <Ruler width={content.width} height={content.height} />

            {blocking ? (
              <Overlay status={blocking} target={target} onReload={onReload} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Ruler({ width, height }: Size) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
    >
      <span className="border-app-border/70 bg-app-canvas/85 text-app-subtle absolute -top-6 left-1/2 -translate-x-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
        {width}px
      </span>
      <span className="border-app-border/70 bg-app-canvas/85 text-app-subtle absolute top-1/2 -left-5 -translate-y-1/2 rounded border px-1 py-1 font-mono text-[10px] tabular-nums [writing-mode:vertical-rl]">
        {height}px
      </span>
    </div>
  );
}

function Overlay({
  status,
  target,
  onReload,
}: {
  readonly status: BlockingStatus;
  readonly target: string;
  readonly onReload: () => void;
}) {
  return (
    <div className="bg-app-canvas/85 absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg px-6 text-center backdrop-blur-[2px]">
      {status === 'loading' ? (
        <div
          role="status"
          className="text-app-muted flex items-center gap-2 text-sm"
        >
          <span className="border-app-border border-t-app-accent size-3.5 animate-spin rounded-full border-2" />
          {STATUS_MESSAGES.loading}
        </div>
      ) : (
        <>
          <AlertIcon className="text-app-warning text-xl" />
          <p className="text-app-muted max-w-sm text-xs leading-relaxed">
            {STATUS_MESSAGES[status]}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<ReloadIcon />}
              onClick={onReload}
            >
              Reload frame
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<ExternalLinkIcon />}
              onClick={() =>
                window.open(target, '_blank', 'noopener,noreferrer')
              }
            >
              Open in new tab
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div
      aria-hidden="true"
      className="border-app-border bg-app-panel/40 size-40 animate-pulse rounded-xl border"
    />
  );
}

function EmptyState() {
  return (
    <div className="border-app-border bg-app-panel/40 max-w-md rounded-xl border border-dashed px-8 py-10 text-center">
      <GlobeIcon className="text-app-subtle mx-auto text-2xl" />
      <h2 className="text-app-text mt-3 text-sm font-semibold">
        Ready to test a page
      </h2>
      <p className="text-app-muted mt-1.5 text-xs leading-relaxed">
        Enter a URL above, pick a device size and the page renders right here.
        Nothing is uploaded — the frame loads the site directly from your
        browser.
      </p>
    </div>
  );
}

'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { AlertIcon, ExternalLinkIcon, ReloadIcon } from '@/components/ui/icons';
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
  loading: 'Loading preview…',
  error:
    'This website cannot be displayed in an embedded preview. It may be blocking iframe embedding with a security policy such as X-Frame-Options or CSP — that is the site’s choice, not a fault here. You can also check that the URL is correct and the server is running.',
  stalled:
    'This website is taking a while to respond inside the frame. Many sites block iframe embedding with X-Frame-Options or a frame-ancestors CSP rule, which stops the preview from ever loading. Open it in a new tab to confirm it works.',
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
            className="relative shrink-0 rounded-md border border-app-border shadow-app-sm"
            style={{ width: display.width, height: display.height }}
          >
            {/*
              Sized to the logical viewport and positioned at the origin. The
              visual scale is applied by the iframe itself, so it must not be
              applied here as well — two nested scales would compound into
              zoom squared.
            */}
            <div
              className="absolute top-0 left-0 overflow-hidden rounded-[5px]"
              style={{ width: content.width, height: content.height }}
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
      <span className="border-app-border bg-app-panel/95 text-app-subtle absolute -top-5 left-1/2 -translate-x-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
        {width}px
      </span>
      <span className="border-app-border bg-app-panel/95 text-app-subtle absolute top-1/2 -left-5 -translate-y-1/2 rounded border px-0.5 py-1 font-mono text-[10px] tabular-nums [writing-mode:vertical-rl]">
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
    <div className="bg-app-overlay absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[5px] px-4 text-center backdrop-blur">
      {status === 'loading' ? (
        <div
          role="status"
          className="text-app-muted flex items-center gap-2 text-xs font-medium"
        >
          <span className="border-app-border border-t-app-accent size-3.5 animate-spin rounded-full border-2" />
          {STATUS_MESSAGES.loading}
        </div>
      ) : (
        <>
          <div className="bg-app-warning/10 flex size-9 items-center justify-center rounded-md ring-1 ring-app-warning/20">
            <AlertIcon className="text-app-warning text-base" />
          </div>
          <p className="text-app-muted max-w-sm text-[11px] leading-relaxed">
            {STATUS_MESSAGES[status]}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
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
              variant="outline"
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
      className="border-app-border bg-app-panel/60 size-36 animate-pulse rounded-md border"
    />
  );
}

function EmptyState() {
  return (
    <div className="max-w-md px-4 py-6 text-center">
      <div
        className="text-app-accent mx-auto mb-3 flex size-11 items-center justify-center rounded-md"
        style={{
          backgroundImage:
            'linear-gradient(135deg, color-mix(in oklab, var(--app-accent) 90%, white 10%), var(--app-accent-strong))',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="1.25rem"
          height="1.25rem"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
        </svg>
      </div>
      <h2 className="text-sm font-semibold tracking-tight">Responsive UI Tester</h2>
      <p className="text-app-muted mt-1.5 text-xs leading-relaxed">
        Test your website across mobile, tablet, desktop, 2K and 4K viewports.
      </p>
      <p className="text-app-subtle mt-1 text-[11px] leading-relaxed">
        Enter a URL above to get started. Everything runs in your browser.
      </p>
    </div>
  );
}

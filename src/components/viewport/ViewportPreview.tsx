'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { AlertIcon, ExternalLinkIcon, ReloadIcon } from '@/components/ui/icons';
import type { FrameStatus } from '@/types/app';
import type {
  DeviceFamily,
  Size,
  ViewportCategory,
  ViewportRegion,
} from '@/types/viewport';
import { PREVIEW_GUTTER } from '@/utils/constants';
import { computeScreenRadius } from '@/utils/device-frame';
import {
  resolveDeviceFamily,
  resolveDeviceOrientation,
} from '@/utils/viewport';
import { DeviceChrome } from './DeviceChrome';
import { ViewportFrame } from './ViewportFrame';

/** Matches the chrome: the frame morphs when the device or its size changes. */
const MOTION = 'transition-[top,left,width,height] duration-200 ease-out';

export interface ViewportPreviewProps {
  readonly target: string | null;
  readonly src: string | null;
  /** Logical size the framed page sees, in CSS pixels. */
  readonly content: Size;
  /** The whole device, screen plus hardware, at zoom 1. */
  readonly presentation: Size;
  /** The same unit after fitting it to the pane. */
  readonly fittedPresentation: Size;
  /** Screen region inside `presentation`. */
  readonly viewportInPresentation: ViewportRegion;
  /** Scale actually applied to the device. */
  readonly effectiveScale: number;
  readonly category?: ViewportCategory | undefined;
  /** The device is physically turned 90° from the size it was selected at. */
  readonly isRotated: boolean;
  /** Unrotated device size — decides which hardware is drawn, not the screen. */
  readonly baseSize: Size;
  readonly reloadKey: number;
  readonly measured: boolean;
  readonly onReload: () => void;
  readonly onDiagnose: () => void;
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
  src,
  content,
  presentation,
  fittedPresentation,
  viewportInPresentation,
  effectiveScale,
  category,
  isRotated,
  baseSize,
  reloadKey,
  measured,
  onReload,
  onDiagnose,
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

  /*
   * The hardware is chosen from the *device* size, not from the screen: in
   * `auto` height mode the screen is stretched to the pane, and a stretched
   * phone is still a phone.
   */
  const family: DeviceFamily = resolveDeviceFamily(category, baseSize);
  const orientation = resolveDeviceOrientation({
    size: baseSize,
    isRotated,
  });

  const screenRadius = computeScreenRadius({
    family,
    presentation,
    viewport: viewportInPresentation,
    orientation,
  });

  const screen = {
    top: viewportInPresentation.top,
    left: viewportInPresentation.left,
    width: content.width,
    height: content.height,
  };

  return (
    <div className="preview-grid scrollbar-slim relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
      <div
        className="flex min-h-full min-w-full items-center justify-center"
        style={{ padding: PREVIEW_GUTTER }}
      >
        {!measured ? (
          <Skeleton />
        ) : target === null || src === null ? (
          <EmptyState />
        ) : (
          <div
            className="relative shrink-0"
            style={{
              width: fittedPresentation.width,
              height: fittedPresentation.height,
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left will-change-transform"
              style={{
                width: presentation.width,
                height: presentation.height,
                transform: `scale(${effectiveScale})`,
                transition:
                  'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), width 200ms cubic-bezier(0.22, 1, 0.36, 1), height 200ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <DeviceChrome
                family={family}
                viewport={viewportInPresentation}
                content={content}
                presentation={presentation}
                orientation={orientation}
              />

              <div
                className={`absolute overflow-hidden bg-black ${MOTION}`}
                style={{ ...screen, borderRadius: screenRadius }}
              >
                <ViewportFrame
                  src={src}
                  content={content}
                  reloadKey={reloadKey}
                  onStatusChange={handleStatusChange}
                />

                {blocking ? (
                  <Overlay
                    status={blocking}
                    target={target}
                    onReload={onReload}
                    onDiagnose={onDiagnose}
                  />
                ) : null}
              </div>

              {/* Glass edge, drawn over the screen so it catches the light. */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute ${MOTION}`}
                style={{
                  ...screen,
                  borderRadius: screenRadius,
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.09), 0 0 20px -8px rgba(0,0,0,0.55)',
                }}
              />

              <SizeRuler
                content={content}
                viewport={viewportInPresentation}
                scale={effectiveScale}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Exact screen size, labelled on the two edges that define it.
 *
 * The labels sit outside the device in the pane's gutter and are counter-scaled,
 * so they stay the same readable size on screen however far the frame is zoomed
 * out — a 4K frame at 10% would otherwise shrink its own dimensions to 3px text.
 */
function SizeRuler({
  content,
  viewport,
  scale,
}: {
  readonly content: Size;
  readonly viewport: ViewportRegion;
  readonly scale: number;
}) {
  const safeScale = Math.max(scale, 0.01);
  const counterScale = 1 / safeScale;
  // `translate(-50%, -100%)` plus this offset clears the device body; it is
  // divided by the scale so the gap is constant in screen pixels.
  const gap = 6 / safeScale;

  const badge =
    'border-app-border bg-app-panel/95 text-app-subtle absolute rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
    >
      <span
        className={badge}
        style={{
          top: -gap,
          left: viewport.left + viewport.width / 2,
          transform: `translate(-50%, -100%) scale(${counterScale})`,
        }}
      >
        {content.width}px
      </span>
      <span
        className={`${badge} py-1 [writing-mode:vertical-rl]`}
        style={{
          top: viewport.top + viewport.height / 2,
          left: -gap,
          transform: `translate(-100%, -50%) scale(${counterScale})`,
        }}
      >
        {content.height}px
      </span>
    </div>
  );
}

function Overlay({
  status,
  target,
  onReload,
  onDiagnose,
}: {
  readonly status: BlockingStatus;
  readonly target: string;
  readonly onReload: () => void;
  readonly onDiagnose: () => void;
}) {
  return (
    <div className="bg-app-overlay absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center backdrop-blur">
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
          <div className="bg-app-warning/10 ring-app-warning/20 flex size-9 items-center justify-center rounded-md ring-1">
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
            <Button size="sm" variant="ghost" onClick={onDiagnose}>
              Why?
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
        className="text-app-accent-contrast mx-auto mb-3 flex size-11 items-center justify-center rounded-md"
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
      <h2 className="text-sm font-semibold tracking-tight">
        Responsive UI Tester
      </h2>
      <p className="text-app-muted mt-1.5 text-xs leading-relaxed">
        Test your website across mobile, tablet, desktop, 2K and 4K viewports.
      </p>
      <p className="text-app-subtle mt-1 text-[11px] leading-relaxed">
        Enter a URL above to get started. Everything runs in your browser.
      </p>
    </div>
  );
}

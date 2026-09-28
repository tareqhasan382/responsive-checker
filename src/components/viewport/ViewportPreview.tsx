'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { AlertIcon, ExternalLinkIcon, ReloadIcon } from '@/components/ui/icons';
import type { FrameStatus } from '@/types/app';
import type { Size, ViewportCategory } from '@/types/viewport';
import type { ViewportRegion } from '@/types/viewport';
import { PREVIEW_GUTTER } from '@/utils/constants';
import { ViewportFrame } from './ViewportFrame';

export interface ViewportPreviewProps {
  readonly target: string | null;
  readonly src: string | null;
  readonly content: Size;
  readonly display: Size;
  readonly presentation: Size;
  readonly fittedPresentation: Size;
  readonly viewportInPresentation: ViewportRegion;
  readonly zoom: number;
  readonly effectiveScale: number;
  readonly category?: ViewportCategory | undefined;
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

function resolveChromeKind(
  category: ViewportCategory | undefined,
  content: Size,
): 'mobile' | 'tablet' | 'desktop' | 'tv' {
  switch (category) {
    case 'mobile':
      return 'mobile';
    case 'tablet':
      return 'tablet';
    case 'desktop':
    case '2k':
    case '4k':
      return 'desktop';
    case 'tv':
      return 'tv';
    case 'custom':
    default: {
      const narrow = Math.min(content.width, content.height);
      const isTall = content.height > content.width;
      if (narrow <= 500 && isTall) return 'mobile';
      if (narrow <= 1300) return 'tablet';
      return 'desktop';
    }
  }
}

function SignalIcon({ className = '' }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <rect x="0" y="8" width="3" height="4" rx="0.5" />
      <rect x="5" y="6" width="3" height="6" rx="0.5" />
      <rect x="10" y="3" width="3" height="9" rx="0.5" />
      <rect x="15" y="0" width="3" height="12" rx="0.5" />
    </svg>
  );
}

function WifiIcon({ className = '' }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 16 12"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M1.5 4A10 10 0 0 1 14.5 4" />
      <path d="M3.5 6.5A7 7 0 0 1 12.5 6.5" />
      <path d="M5.5 9A4 4 0 0 1 10.5 9" />
      <circle cx="8" cy="10.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BatteryIcon({ className = '' }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 26 12"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <rect x="0.6" y="0.6" width="22" height="10.8" rx="2.4" fill="currentColor" fillOpacity="0.15" />
      <rect x="2" y="2" width="17" height="8" rx="1.2" fill="currentColor" />
      <rect x="23.2" y="4" width="1.8" height="4" rx="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MobileChrome({
  viewport,
  content,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
}) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 rounded-[48px] border border-black/80 bg-[#0c0c0e] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]" />
      <div
        className="absolute left-1/2 top-[10px] h-[30px] w-[110px] -translate-x-1/2 rounded-[14px] bg-black"
      />
      <div
        className="absolute left-1/2 top-[14px] h-[22px] w-[92px] -translate-x-1/2 rounded-[11px] bg-[#111]"
      />
      <div
        className="absolute left-0 top-0 flex items-center justify-between px-8 font-sans text-white"
        style={{
          top: 8,
          height: viewport.top - 16,
          width: '100%',
        }}
      >
        <span className="text-[13px] font-semibold tracking-tight">
          9:41
        </span>
        <div className="flex items-center gap-1.5 text-white">
          <SignalIcon className="h-3 w-[18px]" />
          <WifiIcon className="h-3 w-4" />
          <BatteryIcon className="h-3 w-[26px]" />
        </div>
      </div>
      <div
        className="absolute -left-[3px] top-[130px] h-[34px] w-[3px] rounded-l-[2px] bg-[#3a3a3d]"
      />
      <div
        className="absolute -left-[3px] top-[182px] h-[58px] w-[3px] rounded-l-[2px] bg-[#3a3a3d]"
      />
      <div
        className="absolute -left-[3px] top-[254px] h-[58px] w-[3px] rounded-l-[2px] bg-[#3a3a3d]"
      />
      <div
        className="absolute -right-[3px] top-[200px] h-[96px] w-[3px] rounded-r-[2px] bg-[#3a3a3d]"
      />
      <div
        className="absolute left-1/2 bottom-[8px] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/80"
      />
      <div
        className="absolute overflow-hidden bg-black"
        style={{
          top: viewport.top,
          left: viewport.left,
          width: content.width,
          height: content.height,
        }}
      />
    </div>
  );
}

function TabletChrome({
  viewport,
  content,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
}) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 rounded-[32px] border border-black/70 bg-[#101012] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]" />
      <div
        className="absolute left-1/2 top-[10px] h-[8px] w-[8px] -translate-x-1/2 rounded-full bg-[#2b2b2e]"
      />
      <div
        className="absolute overflow-hidden bg-black"
        style={{
          top: viewport.top,
          left: viewport.left,
          width: content.width,
          height: content.height,
        }}
      />
    </div>
  );
}

function DesktopChrome({
  viewport,
  content,
  presentation,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
  readonly presentation: Size;
}) {
  const standTop = viewport.top + content.height;
  const standHeight = presentation.height - standTop;
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-x-0 top-0 rounded-t-xl border-b border-black/60 bg-[#1d1d20] shadow-[0_20px_60px_-18px_rgba(0,0,0,0.7)]" style={{ height: viewport.top + content.height + viewport.left }} />
      <div className="absolute rounded-[2px] bg-black/80" style={{ top: viewport.top - 4, left: viewport.left - 4, width: content.width + 8, height: content.height + 8 }} />
      <div
        className="absolute flex items-center gap-1.5 px-3"
        style={{
          top: 0,
          left: viewport.left - 6,
          height: viewport.top,
        }}
      >
        <span className="size-3 rounded-full bg-[#ff5f57] shadow-inner" />
        <span className="size-3 rounded-full bg-[#febc2e] shadow-inner" />
        <span className="size-3 rounded-full bg-[#28c840] shadow-inner" />
      </div>
      <div
        className="absolute overflow-hidden bg-black"
        style={{
          top: viewport.top,
          left: viewport.left,
          width: content.width,
          height: content.height,
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-[#2a2a2e]"
        style={{
          top: standTop,
          width: Math.max(40, Math.round(content.width * 0.22)),
          height: Math.max(12, Math.round(standHeight * 0.35)),
          clipPath: 'polygon(25% 0, 75% 0, 100% 100%, 0 100%)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-[14px] -translate-x-1/2 rounded-b-xl rounded-t-md bg-[#3a3a3e]"
        style={{
          width: Math.max(120, Math.round(content.width * 0.55)),
        }}
      />
    </div>
  );
}

function TvChrome({
  viewport,
  content,
  presentation,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
  readonly presentation: Size;
}) {
  const standTop = viewport.top + content.height;
  const standHeight = presentation.height - standTop;
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 rounded-[18px] border border-black/80 bg-[#070708] shadow-[0_35px_90px_-20px_rgba(0,0,0,0.85)]" />
      <div
        className="absolute overflow-hidden bg-black"
        style={{
          top: viewport.top,
          left: viewport.left,
          width: content.width,
          height: content.height,
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-[0.3em] text-white/40"
        style={{ top: standTop - 18 }}
      >
        TV
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-[#1b1b1e]"
        style={{
          top: standTop + 2,
          width: Math.max(60, Math.round(content.width * 0.18)),
          height: Math.max(14, Math.round(standHeight * 0.4)),
          clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0 100%)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-[16px] -translate-x-1/2 rounded-b-2xl rounded-t-md bg-[#2a2a2e]"
        style={{
          width: Math.max(160, Math.round(content.width * 0.5)),
        }}
      />
    </div>
  );
}

function Ruler({
  viewport,
  content,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
    >
      <span
        className="border-app-border bg-app-panel/95 text-app-subtle absolute -translate-x-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px] tabular-nums"
        style={{
          top: viewport.top - 22,
          left: viewport.left + viewport.width / 2,
        }}
      >
        {content.width}px
      </span>
      <span
        className="border-app-border bg-app-panel/95 text-app-subtle absolute -translate-y-1/2 rounded border px-0.5 py-1 font-mono text-[10px] tabular-nums [writing-mode:vertical-rl]"
        style={{
          top: viewport.top + viewport.height / 2,
          left: viewport.left - 22,
        }}
      >
        {content.height}px
      </span>
    </div>
  );
}

export function ViewportPreview({
  target,
  src,
  content,
  display,
  presentation,
  fittedPresentation,
  viewportInPresentation,
  zoom,
  effectiveScale,
  category,
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
  void display;
  void zoom;

  const blocking: BlockingStatus | null =
    status === 'loading' || status === 'error' || status === 'stalled'
      ? status
      : null;

  const chromeKind = resolveChromeKind(category, content);

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
                  'transform 160ms ease, width 160ms ease, height 160ms ease',
              }}
            >
              {chromeKind === 'mobile' && (
                <MobileChrome viewport={viewportInPresentation} content={content} />
              )}
              {chromeKind === 'tablet' && (
                <TabletChrome viewport={viewportInPresentation} content={content} />
              )}
              {chromeKind === 'desktop' && (
                <DesktopChrome
                  viewport={viewportInPresentation}
                  content={content}
                  presentation={presentation}
                />
              )}
              {chromeKind === 'tv' && (
                <TvChrome
                  viewport={viewportInPresentation}
                  content={content}
                  presentation={presentation}
                />
              )}

              <Ruler viewport={viewportInPresentation} content={content} />

              <div
                className="absolute overflow-hidden"
                style={{
                  top: viewportInPresentation.top,
                  left: viewportInPresentation.left,
                  width: content.width,
                  height: content.height,
                }}
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
            </div>
          </div>
        )}
      </div>
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

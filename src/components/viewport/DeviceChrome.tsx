'use client';

import { cn } from '@/lib/cn';
import type {
  DeviceFamily,
  DeviceOrientation,
  Size,
  ViewportRegion,
} from '@/types/viewport';
import {
  computePhoneChromeLayout,
  computeTabletChromeLayout,
  type StatusBarLayout,
} from '@/utils/device-frame';
import { clamp } from '@/utils/viewport';

/**
 * Hardware drawn around the preview.
 *
 * Purely decorative and `aria-hidden`, and it never takes pointer events, so the
 * framed page stays fully interactive underneath. Every part is positioned from
 * the layout helpers in `@/utils/device-frame` in unscaled CSS pixels, then
 * scaled together with the screen, which is what keeps the proportions identical
 * in both orientations.
 *
 * Parts glide to their new edge on rotation so the device reads as one object
 * being turned over rather than as a redraw.
 */
const MOTION = 'transition-[top,left,width,height] duration-200 ease-out';

/** Machined titanium, lit from the top. */
const BODY_BACKGROUND =
  'linear-gradient(148deg, #5a5e68 0%, #2c2f36 14%, #141519 42%, #191a1f 62%, #2a2d34 84%, #4b4f59 100%)';

const BODY_SHADOW =
  'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.55), 0 34px 70px -28px rgba(0,0,0,0.75), 0 10px 26px -14px rgba(0,0,0,0.55)';

const KEY_BACKGROUND =
  'linear-gradient(90deg, #4d515b 0%, #6c717c 45%, #3a3d45 100%)';

/** Anodised aluminium, used for the tablet, monitor and TV shells. */
const SHELL_BACKGROUND =
  'linear-gradient(150deg, #3c3f47 0%, #22242a 30%, #15161a 68%, #2e3138 100%)';

const SHELL_SHADOW =
  'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.16), 0 30px 64px -26px rgba(0,0,0,0.7)';

export interface DeviceChromeProps {
  readonly family: DeviceFamily;
  /** Screen region inside the device box. */
  readonly viewport: ViewportRegion;
  readonly content: Size;
  /** The whole drawn device: screen plus hardware. */
  readonly presentation: Size;
  readonly orientation: DeviceOrientation;
}

export function DeviceChrome({
  family,
  viewport,
  content,
  presentation,
  orientation,
}: DeviceChromeProps) {
  const shared = { viewport, content, presentation, orientation };

  switch (family) {
    case 'mobile':
      return <PhoneChrome {...shared} />;
    case 'tablet':
      return <TabletChrome {...shared} />;
    case 'desktop':
      return <DesktopChrome {...shared} />;
    case 'tv':
    default:
      return <TvChrome {...shared} />;
  }
}

function PhoneChrome({
  viewport,
  presentation,
  orientation,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
  readonly presentation: Size;
  readonly orientation: DeviceOrientation;
}) {
  const layout = computePhoneChromeLayout({
    presentation,
    viewport,
    orientation,
  });

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          borderRadius: layout.bodyRadius,
          backgroundImage: BODY_BACKGROUND,
          boxShadow: BODY_SHADOW,
        }}
      />

      {/* Specular line along the lit edge. */}
      <div
        className="absolute top-0 h-px"
        style={{
          left: layout.bodyRadius,
          right: layout.bodyRadius,
          backgroundImage:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0.18) 70%, transparent)',
        }}
      />

      {layout.railMarks.map((mark, index) => (
        <div
          key={index}
          className={cn('absolute', MOTION)}
          style={{
            ...mark,
            borderRadius: 2,
            backgroundImage:
              'linear-gradient(90deg, rgba(255,255,255,0.20), rgba(255,255,255,0.05))',
          }}
        />
      ))}

      <SideKey rect={layout.ringer} />
      <SideKey rect={layout.volumeUp} />
      <SideKey rect={layout.volumeDown} />
      <SideKey rect={layout.sideKey} />

      <div
        className={cn('absolute overflow-hidden', MOTION)}
        style={{
          ...layout.island,
          borderRadius: Math.min(layout.island.width, layout.island.height) / 2,
          backgroundImage: 'linear-gradient(180deg, #000000 0%, #050507 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            ...layout.lens,
            backgroundImage:
              'radial-gradient(circle at 34% 30%, #2f3a55 0%, #0b0f1a 55%, #05060a 100%)',
            boxShadow: 'inset 0 0 3px rgba(126,162,255,0.28)',
          }}
        />
      </div>

      <StatusBar layout={layout.statusBar} />

      <div
        className={cn('absolute', MOTION)}
        style={{
          ...layout.homeIndicator,
          borderRadius: 999,
          backgroundImage: 'rgba(255,255,255,0.82)',
        }}
      />
    </div>
  );
}

function SideKey({ rect }: { readonly rect: ViewportRegion }) {
  return (
    <div
      className={cn('absolute', MOTION)}
      style={{
        ...rect,
        borderRadius: 2,
        backgroundImage: KEY_BACKGROUND,
        boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }}
    />
  );
}

function StatusBar({ layout }: { readonly layout: StatusBarLayout }) {
  return (
    <div
      className={cn(
        'absolute left-0 flex items-center justify-between',
        MOTION,
      )}
      style={{
        top: 0,
        height: layout.height,
        paddingLeft: layout.inset,
        paddingRight: layout.inset,
      }}
    >
      <span className="font-sans text-[13px] leading-none font-semibold tracking-tight text-white/90 tabular-nums">
        9:41
      </span>
      <span className="flex items-center gap-1.5 text-white/90">
        <SignalIcon className="h-3 w-[17px]" />
        <WifiIcon className="h-3 w-4" />
        <BatteryIcon className="h-3 w-[26px]" />
      </span>
    </div>
  );
}

function TabletChrome({
  viewport,
  presentation,
  orientation,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
  readonly presentation: Size;
  readonly orientation: DeviceOrientation;
}) {
  const layout = computeTabletChromeLayout({
    presentation,
    viewport,
    orientation,
  });

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          borderRadius: layout.bodyRadius,
          backgroundImage: SHELL_BACKGROUND,
          boxShadow: SHELL_SHADOW,
        }}
      />
      <div
        className={cn('absolute rounded-full', MOTION)}
        style={{
          ...layout.camera,
          backgroundImage:
            'radial-gradient(circle at 35% 32%, #33405e 0%, #0a0d16 60%, #06070b 100%)',
          boxShadow: 'inset 0 0 2px rgba(126,162,255,0.3)',
        }}
      />
      {layout.homeIndicator ? (
        <div
          className={cn('absolute', MOTION)}
          style={{
            ...layout.homeIndicator,
            borderRadius: 999,
            backgroundImage: 'rgba(255,255,255,0.6)',
          }}
        />
      ) : null}
    </div>
  );
}

/** Monitor: thin bezel, a chin with room to breathe, and a stand. */
function DesktopChrome({
  viewport,
  content,
  presentation,
}: {
  readonly viewport: ViewportRegion;
  readonly content: Size;
  readonly presentation: Size;
  readonly orientation: DeviceOrientation;
}) {
  const screenBottom = viewport.top + content.height;
  const panelHeight = presentation.height - standZone(presentation.height, 34);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: panelHeight,
          borderRadius: 12,
          backgroundImage: SHELL_BACKGROUND,
          boxShadow: SHELL_SHADOW,
        }}
      />

      {/* Display well, open at the bottom so the chin reads as a chin. */}
      <div
        className="absolute"
        style={{
          top: viewport.top - 5,
          left: viewport.left - 5,
          width: content.width + 10,
          height: content.height + 5,
          borderRadius: 5,
          backgroundColor: '#050506',
        }}
      />

      <div
        className="absolute flex items-center gap-2"
        style={{ top: 0, left: viewport.left + 16, height: viewport.top }}
      >
        <span className="size-[11px] rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
        <span className="size-[11px] rounded-full bg-[#febc2e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
        <span className="size-[11px] rounded-full bg-[#28c840] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
      </div>

      <ChinMark
        top={screenBottom}
        chin={panelHeight - screenBottom}
        width={44}
      />

      <Stand
        panelBottom={panelHeight}
        presentation={presentation}
        neckWidth={Math.max(44, Math.round(content.width * 0.16))}
        baseWidth={Math.max(150, Math.round(content.width * 0.46))}
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
  readonly orientation: DeviceOrientation;
}) {
  const screenBottom = viewport.top + content.height;
  const panelHeight = presentation.height - standZone(presentation.height, 30);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: panelHeight,
          borderRadius: 10,
          backgroundImage:
            'linear-gradient(160deg, #2a2c31 0%, #131418 40%, #0c0d10 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.07), 0 34px 80px -28px rgba(0,0,0,0.8)',
        }}
      />
      <div
        className="absolute"
        style={{
          top: viewport.top - 4,
          left: viewport.left - 4,
          width: content.width + 8,
          height: content.height + 4,
          borderRadius: 3,
          backgroundColor: '#040405',
        }}
      />

      <ChinMark
        top={screenBottom}
        chin={panelHeight - screenBottom}
        width={34}
        height={3}
        opacity="bg-white/20"
      />

      <Stand
        panelBottom={panelHeight}
        presentation={presentation}
        neckWidth={Math.max(70, Math.round(content.width * 0.14))}
        baseWidth={Math.max(190, Math.round(content.width * 0.42))}
      />
    </div>
  );
}

/** Room reserved under the panel for the stand. */
function standZone(presentationHeight: number, max: number): number {
  return Math.round(clamp(presentationHeight * 0.05, 22, max));
}

function ChinMark({
  top,
  chin,
  width,
  height = 5,
  opacity = 'bg-white/12',
}: {
  readonly top: number;
  readonly chin: number;
  readonly width: number;
  readonly height?: number;
  readonly opacity?: string;
}) {
  return (
    <div
      className={cn('absolute left-1/2 -translate-x-1/2 rounded-full', opacity)}
      style={{
        top: top + Math.round(chin * 0.42),
        width,
        height,
      }}
    />
  );
}

function Stand({
  panelBottom,
  presentation,
  neckWidth,
  baseWidth,
}: {
  readonly panelBottom: number;
  readonly presentation: Size;
  readonly neckWidth: number;
  readonly baseWidth: number;
}) {
  const zone = presentation.height - panelBottom;
  const neckHeight = Math.max(6, Math.round(zone * 0.42));
  const baseHeight = Math.max(4, zone - neckHeight);
  const baseRadius = Math.round(baseHeight * 0.8);

  return (
    <>
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: panelBottom - 2,
          width: neckWidth,
          height: neckHeight,
          backgroundImage: 'linear-gradient(180deg, #33363d 0%, #1c1e23 100%)',
          clipPath: 'polygon(24% 0, 76% 0, 100% 100%, 0 100%)',
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: panelBottom + neckHeight - 2,
          width: baseWidth,
          height: baseHeight + 2,
          borderRadius: `0 0 ${baseRadius}px ${baseRadius}px`,
          backgroundImage:
            'linear-gradient(180deg, #4a4e57 0%, #2a2d33 40%, #17181c 100%)',
          boxShadow: '0 10px 18px -10px rgba(0,0,0,0.7)',
        }}
      />
    </>
  );
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
      <rect
        x="0.6"
        y="0.6"
        width="22"
        height="10.8"
        rx="2.4"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <rect x="2" y="2" width="17" height="8" rx="1.2" fill="currentColor" />
      <rect
        x="23.2"
        y="4"
        width="1.8"
        height="4"
        rx="0.6"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

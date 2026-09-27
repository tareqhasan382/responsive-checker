import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { GoBackButton } from '@/components/ui/GoBackButton';
import { GlobeIcon } from '@/components/ui/icons';

export default function NotFound() {
  return (
    <div className="bg-app-canvas relative flex h-dvh w-full items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 10%, color-mix(in oklab, var(--app-accent) 18%, transparent) 0%, transparent 45%), radial-gradient(circle at 85% 90%, color-mix(in oklab, var(--app-accent-strong) 14%, transparent) 0%, transparent 40%)',
        }}
      />

      <div className="border-app-border/60 bg-app-panel/70 relative z-10 mx-4 w-full max-w-md rounded-2xl border p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span
            className="text-app-accent flex size-14 items-center justify-center rounded-2xl shadow-inner"
            style={{
              backgroundImage:
                'linear-gradient(135deg, color-mix(in oklab, var(--app-accent) 14%, transparent), color-mix(in oklab, var(--app-accent-strong) 18%, transparent))',
              border:
                '1px solid color-mix(in oklab, var(--app-accent) 40%, transparent)',
            }}
          >
            <GlobeIcon className="text-2xl" />
          </span>

          <p className="text-app-muted mt-6 font-mono text-xs tracking-[0.25em] uppercase">
            HTTP status
          </p>

          <h1
            className="mt-1 bg-clip-text text-[88px] leading-none font-black tracking-tight text-transparent sm:text-[112px]"
            style={{
              backgroundImage:
                'linear-gradient(135deg, var(--app-text) 0%, color-mix(in oklab, var(--app-accent-strong) 80%, var(--app-text)) 55%, var(--app-accent) 100%)',
            }}
          >
            404
          </h1>

          <h2 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
            Page not found
          </h2>
          <p className="text-app-muted mt-2 max-w-sm text-sm leading-relaxed sm:text-[14.5px]">
            The page you&apos;re looking for doesn&apos;t exist, was moved, or
            was never here. Head home and test any URL across mobile, tablet,
            desktop and TV viewports.
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
            <Link href="/" className="sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <GlobeIcon className="text-base" />
                Open tester
              </Button>
            </Link>
            <GoBackButton className="w-full sm:w-auto" />
          </div>

          <p className="text-app-muted mt-8 text-[11px] tracking-wide">
            Responsive Tester · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

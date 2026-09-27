'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { AlertIcon, RulerIcon, TestIcon } from '@/components/ui/icons';

export interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (typeof console !== 'undefined' && error) {
      // Intentionally report so Sentry-like platforms can pick it up.
      console.error('[Responsive Tester] Unhandled error:', error);
    }
  }, [error]);

  return (
    <div className="bg-app-canvas relative flex h-dvh w-full items-center justify-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, color-mix(in oklab, var(--app-danger) 12%, transparent) 0%, transparent 40%), radial-gradient(circle at 20% 90%, color-mix(in oklab, var(--app-accent) 10%, transparent) 0%, transparent 40%)',
        }}
      />

      <div className="border-app-border/60 bg-app-panel/70 relative z-10 mx-4 w-full max-w-lg rounded-2xl border p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span
            className="text-app-danger flex size-14 items-center justify-center rounded-2xl"
            style={{
              backgroundImage:
                'linear-gradient(135deg, color-mix(in oklab, var(--app-danger) 10%, transparent), color-mix(in oklab, var(--app-danger) 18%, transparent))',
              border:
                '1px solid color-mix(in oklab, var(--app-danger) 40%, transparent)',
            }}
          >
            <AlertIcon className="text-2xl" />
          </span>

          <p className="text-app-muted mt-6 font-mono text-xs tracking-[0.25em] uppercase">
            Something broke
          </p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Couldn&apos;t load the tester
          </h2>

          <p className="text-app-muted mt-2 max-w-md text-sm leading-relaxed sm:text-[14.5px]">
            The app hit an unexpected error while rendering. It&apos;s safe to
            retry — in most cases the viewport, URL and devices load back
            without losing anything.
          </p>

          {error?.message ? (
            <pre className="text-app-muted border-app-border/70 bg-app-canvas/60 mt-5 w-full overflow-x-auto rounded-xl border p-3 text-left text-[11.5px] leading-relaxed">
              <code>{error.message}</code>
            </pre>
          ) : null}

          <div className="mt-8 flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
            <Button
              variant="primary"
              size="lg"
              icon={<RulerIcon className="text-base" />}
              onClick={() => reset()}
              className="w-full sm:w-auto"
            >
              Retry render
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={<TestIcon className="text-base" />}
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              Reload page
            </Button>
          </div>

          <p className="text-app-muted mt-8 text-[11px] tracking-wide">
            {error?.digest ? (
              <>
                Trace digest: <code className="font-mono">{error.digest}</code>
              </>
            ) : (
              <>Responsive Tester · {new Date().getFullYear()}</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

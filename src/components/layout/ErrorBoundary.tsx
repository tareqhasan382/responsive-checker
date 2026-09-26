'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { AlertIcon, ReloadIcon } from '@/components/ui/icons';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

/**
 * Catches render-time failures anywhere below it and swaps in a recovery screen.
 *
 * Deliberately a class component: there is no hook equivalent of
 * `componentDidCatch`. The fallback shows a plain message and a reload — the
 * error itself stays in the console, because surfacing a stack trace to the
 * user helps nobody and can leak internals.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Responsive Tester crashed:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

function ErrorFallback() {
  return (
    <div className="bg-app-canvas flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="border-app-border bg-app-panel text-app-danger flex size-11 items-center justify-center rounded-xl border">
        <AlertIcon className="text-xl" />
      </span>

      <div>
        <h1 className="text-base font-semibold">Something went wrong</h1>
        <p className="text-app-muted mt-1.5 max-w-sm text-sm leading-relaxed">
          The tester hit an unexpected error. Reloading usually fixes it. Your
          saved viewports and settings are kept.
        </p>
      </div>

      <Button variant="primary" icon={<ReloadIcon />} onClick={reload}>
        Reload the application
      </Button>
    </div>
  );
}

function reload(): void {
  window.location.reload();
}

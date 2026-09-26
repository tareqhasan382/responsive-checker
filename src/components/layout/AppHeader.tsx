import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { GlobeIcon } from '@/components/ui/icons';

export interface AppHeaderProps {
  readonly children?: ReactNode;
}

export function AppHeader({ children }: AppHeaderProps) {
  return (
    <header
      className="border-app-border bg-app-panel/90 backdrop-blur-md sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-2 py-1.5 sm:px-2.5"
      style={{
        backgroundImage:
          'linear-gradient(180deg, color-mix(in oklab, var(--app-panel) 95%, var(--app-accent) 5%), var(--app-panel))',
      }}
    >
      <span
        className="bg-app-accent text-app-accent-contrast flex size-6 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundImage:
            'linear-gradient(135deg, var(--app-accent), var(--app-accent-strong))',
        }}
      >
        <GlobeIcon className="text-[13px]" />
      </span>

      <h1 className="truncate text-[13px] leading-tight font-semibold tracking-tight">
        Responsive Tester
      </h1>

      {children ? (
        <div className="min-w-0 flex-1">{children}</div>
      ) : null}

      <div className="ml-auto flex items-center gap-1.5">
        <span
          className="border-app-border bg-app-canvas/90 text-app-muted hidden shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] lg:flex"
        >
          <span className="bg-app-success size-1.5 rounded-full" />
          100% in your browser
        </span>

        <ThemeToggle />
      </div>
    </header>
  );
}

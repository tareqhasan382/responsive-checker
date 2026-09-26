import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { GlobeIcon } from '@/components/ui/icons';

export interface AppHeaderProps {
  readonly children?: ReactNode;
}

export function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="border-app-border bg-app-canvas flex shrink-0 items-center gap-2.5 border-b px-3 py-2 sm:px-4">
      <span className="bg-app-selected-bg text-app-selected-text flex size-7 shrink-0 items-center justify-center rounded-md">
        <GlobeIcon className="text-base" />
      </span>

      <h1 className="truncate text-sm leading-tight font-semibold tracking-tight">
        Responsive Tester
      </h1>

      {children ? (
        <div className="min-w-0 flex-1">{children}</div>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <span className="border-app-border bg-app-panel text-app-muted hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] lg:flex">
          <span className="bg-app-success size-1.5 rounded-full" />
          100% in your browser
        </span>

        <ThemeToggle />
      </div>
    </header>
  );
}

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { AppHeader } from './AppHeader';

export interface AppShellProps {
  readonly children: ReactNode;
  /** Optional status strip rendered below the workspace. */
  readonly status?: ReactNode;
}

export function AppShell({ children, status }: AppShellProps) {
  return (
    <div className="bg-app-canvas flex h-dvh flex-col overflow-hidden">
      <AppHeader />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      {status ? (
        <footer
          className={cn(
            'border-app-border flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t',
            'bg-app-canvas text-app-subtle px-4 py-1.5 text-[11px]',
          )}
        >
          {status}
        </footer>
      ) : null}
    </div>
  );
}

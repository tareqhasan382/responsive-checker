import type { ReactNode } from 'react';

import { AppHeader } from './AppHeader';

export interface AppShellProps {
  readonly children: ReactNode;
  /** Optional content rendered in the header between title and actions. */
  readonly headerContent?: ReactNode;
}

/**
 * Page frame: header, a scrolling-free main column that owns the remaining
 * height. Everything inside `main` is expected to manage its own overflow so
 * the app never scrolls as a whole.
 */
export function AppShell({ children, headerContent }: AppShellProps) {
  return (
    <div className="bg-app-canvas flex h-dvh flex-col overflow-hidden">
      <AppHeader>{headerContent}</AppHeader>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

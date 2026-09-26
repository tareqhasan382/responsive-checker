import { GlobeIcon } from '@/components/ui/icons';

export function AppHeader() {
  return (
    <header className="border-app-border bg-app-canvas flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
      <span className="bg-app-accent/15 text-app-accent flex size-7 items-center justify-center rounded-md">
        <GlobeIcon className="text-base" />
      </span>

      <div className="min-w-0">
        <h1 className="text-sm leading-tight font-semibold tracking-tight">
          Responsive UI Tester
        </h1>
        <p className="text-app-subtle hidden text-[11px] leading-tight sm:block">
          Load any URL in a resizable viewport and inspect the result
        </p>
      </div>

      <span className="border-app-border bg-app-panel text-app-muted ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] md:flex">
        <span className="bg-app-success size-1.5 rounded-full" />
        100% in your browser
      </span>
    </header>
  );
}

export default function Loading() {
  return (
    <div className="bg-app-canvas flex h-dvh flex-col overflow-hidden">
      {/* Header skeleton */}
      <header className="border-app-border bg-app-panel/90 sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-2 py-1.5 sm:px-2.5">
        <span className="bg-app-accent/30 size-6 shrink-0 animate-pulse rounded-md" />
        <span className="bg-app-hover hidden h-3.5 w-[120px] shrink-0 animate-pulse rounded-md sm:block" />
        <span className="bg-app-hover h-7 min-w-0 flex-1 animate-pulse rounded-md" />
        <span className="bg-app-hover size-8 w-[90px] shrink-0 animate-pulse rounded-md" />
        <span className="bg-app-hover size-7 shrink-0 animate-pulse rounded-md" />
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar skeleton */}
        <aside className="border-app-border bg-app-panel flex w-64 shrink-0 flex-col overflow-hidden border-r">
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="bg-app-hover/60 h-14 animate-pulse" />
            <div className="flex items-center justify-center gap-1.5 p-2">
              {[
                'bg-app-accent',
                'bg-app-hover',
                'bg-app-hover',
                'bg-app-hover',
                'bg-app-hover',
                'bg-app-hover',
              ].map((cls, i) => (
                <span
                  key={i}
                  className={`${cls} h-7 flex-1 animate-pulse rounded-md opacity-70`}
                />
              ))}
            </div>
            <div className="bg-app-hover/70 mx-2 mt-1 h-8 animate-pulse rounded-md" />
            <div className="flex flex-col gap-1.5 px-2 py-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2"
                  style={{ opacity: 1 - (i % 4) * 0.12 }}
                >
                  <span className="bg-app-hover/80 h-10 flex-1 animate-pulse rounded-md" />
                  <span className="bg-app-hover/60 h-10 w-24 shrink-0 animate-pulse rounded-md" />
                </div>
              ))}
            </div>
            <div className="bg-app-hover/40 mx-2 h-10 animate-pulse rounded-md" />
            <div className="bg-app-hover/70 mx-2 mt-3 h-8 animate-pulse rounded-md" />
            <div className="mx-2 mt-2 flex items-center justify-center gap-1.5">
              <span className="bg-app-hover/70 h-7 w-7 animate-pulse rounded-md" />
              <span className="bg-app-hover/60 h-7 flex-1 animate-pulse rounded-md" />
              <span className="bg-app-hover/70 h-7 w-7 animate-pulse rounded-md" />
              <span className="bg-app-hover/70 h-7 w-7 animate-pulse rounded-md" />
            </div>
          </div>

          {/* Author footer skeleton */}
          <div className="border-app-border shrink-0 border-t p-2">
            <div className="border-app-border bg-app-elevated flex items-center gap-2 rounded-lg border p-1.5">
              <span className="bg-app-hover h-7 w-7 shrink-0 animate-pulse rounded-full" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="bg-app-hover h-2.5 w-20 animate-pulse rounded-full" />
                <span className="bg-app-hover/70 h-2 w-14 animate-pulse rounded-full" />
              </span>
              <span className="bg-app-hover/70 h-3 w-3 shrink-0 animate-pulse rounded-sm" />
            </div>
          </div>
        </aside>

        {/* Preview skeleton */}
        <section className="relative flex min-w-0 flex-1 items-center justify-center p-5">
          <div className="relative flex shrink-0 animate-pulse flex-col items-center justify-center gap-3">
            <span className="text-app-muted bg-app-hover/80 h-4 w-14 rounded-md" />
            <div className="border-app-border flex items-start justify-start gap-4 rounded-xl border p-4">
              <div
                className="bg-app-hover/60 rounded-lg"
                style={{ width: 240, height: 160 }}
              />
            </div>
            <span className="text-app-muted bg-app-hover/80 h-4 w-16 rounded-md" />
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--app-panel) 40%, transparent) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'preview-shimmer 1.6s ease-in-out infinite',
            }}
          />
        </section>
      </div>

      <style>{`
        @keyframes preview-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

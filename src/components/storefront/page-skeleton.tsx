export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="aspect-square animate-pulse bg-secondary motion-reduce:animate-none" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-16 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

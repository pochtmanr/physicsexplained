import { Skeleton } from "./skeleton";

export function IndexGridSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2 [&>*]:-ml-px [&>*]:-mt-px">
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 border border-[var(--color-fg-4)] p-6"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
          </div>
        ))}
      </div>
    </div>
  );
}

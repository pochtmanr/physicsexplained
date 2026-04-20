import { Skeleton } from "./skeleton";

export function PhysicistDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] space-y-8 px-6 py-12">
      {/* eyebrow */}
      <Skeleton className="h-3 w-40" />
      {/* title */}
      <Skeleton className="h-12 w-5/6" />
      {/* subtitle / dates */}
      <Skeleton className="mt-4 h-4 w-1/2" />
      {/* portrait / image block */}
      <div className="mt-10">
        <Skeleton className="aspect-[4/3] w-full" />
      </div>
      {/* section — biography */}
      <div className="mt-12 space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      {/* section — contributions */}
      <div className="mt-12 space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

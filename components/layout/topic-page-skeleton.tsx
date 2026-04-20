import { Skeleton } from "./skeleton";

export function TopicPageSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] space-y-8 px-6 py-12">
      {/* eyebrow */}
      <Skeleton className="h-3 w-40" />
      {/* title */}
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-5/6" />
      {/* subtitle */}
      <Skeleton className="mt-6 h-5 w-3/4" />
      {/* section */}
      <div className="mt-16 space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      {/* figure */}
      <div className="mt-12">
        <Skeleton className="aspect-[4/3] w-full" />
      </div>
      {/* another section */}
      <div className="mt-16 space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
        </div>
      </div>
    </div>
  );
}

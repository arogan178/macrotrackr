import Skeleton from "@/components/ui/Skeleton";

/** The weight plan's shape: header, figure, journey line, three stats, action. */
export function WeightGoalSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-card border border-border bg-surface max-md:rounded-none max-md:border-0 max-md:bg-transparent"
    >
      <div className="flex items-start justify-between gap-3 md:p-6 md:pb-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" rounded="full" />
          <Skeleton className="h-9 w-9" rounded="full" />
        </div>
      </div>
      <div className="mt-6 md:px-6">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="mt-4 h-2 w-full" rounded="full" />
        <div className="mt-2 flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="mt-3 h-4 w-40" />
      </div>
      <div className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="space-y-1.5 px-3 py-3 first:pl-0 md:px-6 md:first:pl-6"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
      <div className="mt-6 md:px-6 md:pb-6">
        <Skeleton className="h-10 w-full" rounded="full" />
      </div>
    </div>
  );
}

/** Goals while the account loads: the plan, maintenance, then habits. */
export default function GoalsLoadingSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-10 md:space-y-6">
      <WeightGoalSkeleton />
      <div>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-2 h-3 w-64" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[0, 1].map((index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-20" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

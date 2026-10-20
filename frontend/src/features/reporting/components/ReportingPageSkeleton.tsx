import Panel from "@/components/ui/Panel";
import Skeleton from "@/components/ui/Skeleton";

export default function ReportingPageSkeleton() {
  return (
    <>
      {/* Phone: period tabs, then the four average rows with their day bars. */}
      <div aria-hidden="true" className="md:hidden">
        <Skeleton className="h-11 w-full" rounded="card" />
        <Skeleton className="mt-10 h-3 w-44" />
        <div className="mt-4 space-y-5">
          {[0, 1, 2, 3].map((index) => (
            <div key={index}>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="mt-2 h-12 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-10 h-5 w-32" />
        <Skeleton className="mt-4 h-64 w-full" rounded="card" />
      </div>
      <div aria-hidden="true" className="hidden w-full md:block">
        <div className="mb-6 flex justify-end">
          <Skeleton className="h-11 w-48" rounded="card" />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-28" rounded="card" />
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-72" rounded="card" />
          <Skeleton className="h-72" rounded="card" />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-[340px]" rounded="card" />
          <Skeleton className="h-[340px]" rounded="card" />
        </div>

        <Panel className="mb-6">
          <Skeleton className="mb-6 h-6 w-40" />
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-40" rounded="card" />
            ))}
          </div>
          <Skeleton className="h-24 w-full" rounded="card" />
        </Panel>
      </div>
    </>
  );
}

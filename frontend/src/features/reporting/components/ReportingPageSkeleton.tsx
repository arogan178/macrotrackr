import Panel from "@/components/ui/Panel";
import Skeleton from "@/components/ui/Skeleton";

export default function ReportingPageSkeleton() {
  return (
    <div className="w-full">
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
  );
}

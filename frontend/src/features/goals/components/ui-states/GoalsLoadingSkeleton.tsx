import Panel from "@/components/ui/Panel";
import Skeleton from "@/components/ui/Skeleton";

export default function GoalsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14" rounded="card" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32" rounded="full" />
            <Skeleton className="h-11 w-11" rounded="full" />
          </div>
        </div>

        <Skeleton className="mb-8 h-24" rounded="card" />

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-24" rounded="card" />
          <Skeleton className="h-24" rounded="card" />
          <Skeleton className="h-24" rounded="card" />
        </div>

        <Skeleton className="h-40" rounded="card" />
      </Panel>

      <Panel padding="none">
        <Skeleton className="h-80" rounded="card" />
      </Panel>

      <Panel padding="none">
        <Skeleton className="h-64" rounded="card" />
      </Panel>
    </div>
  );
}

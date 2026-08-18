import Panel from "@/components/ui/Panel";
import Skeleton from "@/components/ui/Skeleton";

export const AddEntryLoadingSkeleton = () => (
  <Panel className="flex flex-col">
    <div className="mb-5 flex items-center justify-between">
      <Skeleton className="h-6 w-1/3" />
    </div>
    <Skeleton className="mb-5 h-11 w-full" />
    <div className="mb-5 grid grid-cols-3 gap-5">
      <Skeleton className="col-span-1 h-11" />
      <Skeleton className="col-span-2 h-11" />
    </div>
    <div className="mb-5 grid grid-cols-3 gap-5">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-11" />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-11" />
      ))}
    </div>
  </Panel>
);

export const DailySummaryLoadingSkeleton = () => (
  <Panel className="flex flex-col">
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-8 w-1/4" />
    </div>
    <Skeleton className="mb-6 h-4 w-full" rounded="full" />
    <div className="space-y-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="space-y-2 border-t border-border pt-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-full" rounded="full" />
        </div>
      ))}
    </div>
  </Panel>
);

export const HistoryLoadingSkeleton = () => (
  <Panel padding="none">
    <div className="p-4 sm:p-6">
      <Skeleton className="mb-3 h-6 w-1/4" />
      <Skeleton className="h-4 w-1/6" />
    </div>
    {[0, 1, 2].map((index) => (
      <div key={index} className="space-y-2 border-t border-border p-4 sm:p-6">
        <Skeleton className="h-4 w-1/5" />
        <Skeleton className="h-10" />
      </div>
    ))}
  </Panel>
);

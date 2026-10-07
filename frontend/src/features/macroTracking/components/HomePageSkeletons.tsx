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

/** The Log sheet's form while its chunk loads. Phone-sized it is the form's
 *  height, so the sheet does not jump; sm overrides would cost UI budget. */
export const LogSheetFormSkeleton = () => (
  <div aria-hidden="true">
    {["w-28", "w-24", "w-20", "w-20"].map((labelWidth, index) => (
      <div key={labelWidth + index} className="mb-3.5">
        <Skeleton className={`mb-2 h-4 ${labelWidth}`} />
        <Skeleton className={index === 0 ? "h-11 w-full" : "h-10 w-full"} />
      </div>
    ))}
    <Skeleton className="mb-4 h-4 w-32" />
    <div className="mb-4 grid grid-cols-3 gap-3">
      {[0, 1, 2].map((index) => (
        <div key={index}>
          <Skeleton className="mb-2 h-4 w-12" />
          <Skeleton className="h-10" />
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between border-t border-border pt-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-11 w-28" rounded="full" />
    </div>
  </div>
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

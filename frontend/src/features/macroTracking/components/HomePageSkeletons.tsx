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

/** The day's shape on a phone: hero figure, gauge, then three macro rows. */
export const DailySummaryLoadingSkeleton = () => (
  <Panel padding="none" flatOnPhone>
    <div aria-hidden="true" className="md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-12 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-8" rounded="full" />
      </div>
      <Skeleton className="mt-5 h-3 w-full" rounded="full" />
      <div className="mt-2 flex min-h-11 items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
    <div
      aria-hidden="true"
      className="mt-6 space-y-5 md:mt-0 md:border-t md:border-border md:p-6"
    >
      {[0, 1, 2].map((index) => (
        <div key={index}>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-2 h-2 w-full" rounded="full" />
        </div>
      ))}
    </div>
  </Panel>
);

/** History's shape: heading and actions, a day row, then entry rows. It sits
 *  inside the history panel, so it draws no panel of its own. */
export const HistoryLoadingSkeleton = () => (
  <div aria-hidden="true">
    <div className="mb-3 flex items-center justify-between">
      <Skeleton className="h-5 w-20" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16" rounded="full" />
        <Skeleton className="h-9 w-9" rounded="full" />
      </div>
    </div>
    <div className="-mx-4 border-y border-border sm:-mx-6 md:mx-0">
      <div className="flex min-h-12 items-center justify-between border-b border-border px-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="space-y-2 border-b border-border px-4 py-3 last:border-b-0">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  </div>
);

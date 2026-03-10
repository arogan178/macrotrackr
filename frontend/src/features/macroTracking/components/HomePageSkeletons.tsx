import { CardContainer } from "@/components/form";
export const AddEntryLoadingSkeleton = () => (
  <CardContainer className="flex h-full flex-col justify-between rounded-2xl border-border/60">
    <div className="animate-pulse p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-6 w-1/3 rounded bg-surface-2"></div>
      </div>
      <div className="mb-5 h-11 w-full rounded bg-surface-2"></div>
      <div className="mb-5 grid grid-cols-3 gap-5">
        <div className="col-span-1 h-10 rounded bg-surface-2"></div>
        <div className="col-span-2 h-10 rounded bg-surface-2"></div>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-5">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-10 rounded bg-surface-2"></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-10 rounded bg-surface-2"></div>
        ))}
      </div>
    </div>
  </CardContainer>
);

export const DailySummaryLoadingSkeleton = () => (
  <CardContainer className="h-full rounded-2xl border-border/60">
    <div className="flex h-full animate-pulse flex-col gap-3 p-3">
      <div className="rounded-2xl border border-border/60 bg-surface-2 p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-1/3 rounded bg-surface-3"></div>
          <div className="h-8 w-1/4 rounded bg-surface-3"></div>
        </div>
        <div className="mb-2 h-4 w-full rounded bg-surface-3"></div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex flex-1 flex-col justify-center rounded-2xl border border-border/60 bg-surface-2 p-4"
          >
            <div className="mb-2 h-4 w-1/4 rounded bg-surface-3"></div>
            <div className="h-3 w-full rounded bg-surface-3"></div>
          </div>
        ))}
      </div>
    </div>
  </CardContainer>
);

export const HistoryLoadingSkeleton = () => (
  <div className="rounded-2xl border border-border/60 bg-surface p-5">
    <div className="animate-pulse space-y-4">
      <div className="mb-5 h-6 w-1/4 rounded bg-surface-2"></div>
      <div className="mb-6 h-4 w-1/6 rounded bg-surface-2"></div>
      {[0, 1].map((index) => (
        <div
          key={index}
          className="space-y-2 rounded-2xl border border-border/60 bg-surface p-5"
        >
          <div className="h-4 w-1/5 rounded bg-surface-2"></div>
          <div className="h-10 rounded bg-surface-2"></div>
        </div>
      ))}
    </div>
  </div>
);

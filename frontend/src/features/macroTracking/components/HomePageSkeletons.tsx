// Loading skeleton components extracted from HomePage
// File: [frontend/src/features/macroTracking/pages/HomePage.Skeletons.tsx](frontend/src/features/macroTracking/pages/HomePage.Skeletons.tsx:1)

import { CardContainer } from "@/components/form";

/**
 * Skeleton shown while AddEntryForm is loading.
 * Markup and classes identical to inline component previously in
 * [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:251).
 */
export const AddEntryLoadingSkeleton = () => (
  <CardContainer>
    <div className="animate-pulse p-5">
      <div className="mb-4 h-4 w-1/3 rounded bg-surface-2"></div>
      <div className="mb-4 h-10 w-full rounded bg-surface-2"></div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-10 rounded bg-surface-2"></div>
        ))}
      </div>
    </div>
  </CardContainer>
);

/**
 * Skeleton shown while DailySummaryPanel is loading.
 * Markup and classes identical to inline component previously in
 * [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:264).
 */
export const DailySummaryLoadingSkeleton = () => (
  <CardContainer className="h-full">
    <div className="h-full animate-pulse p-5">
      <div className="mb-4 rounded-xl bg-surface-2 p-4">
        <div className="mb-3 h-4 w-1/3 rounded bg-surface-3"></div>
        <div className="h-3 w-full rounded bg-surface-3"></div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-xl bg-surface-2 p-4">
            <div className="mb-2 h-3 w-1/4 rounded bg-surface-3"></div>
            <div className="h-2 w-full rounded bg-surface-3"></div>
          </div>
        ))}
      </div>
    </div>
  </CardContainer>
);

/**
 * Skeleton shown while the history section is loading.
 * Markup and classes identical to inline component previously in
 * [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:277).
 */
export const HistoryLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="mb-4 h-5 w-1/4 rounded bg-surface-2"></div>
    <div className="h-3 w-1/6 rounded bg-surface-2"></div>
    {[0, 1].map((index) => (
      <div
        key={index}
        className="space-y-2 rounded-xl border border-border bg-surface-2 p-4"
      >
        <div className="h-4 w-1/5 rounded bg-surface-3"></div>
        <div className="h-10 rounded bg-surface-3"></div>
      </div>
    ))}
  </div>
);

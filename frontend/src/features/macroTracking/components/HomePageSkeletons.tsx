// Loading skeleton components extracted from HomePage
// File: [frontend/src/features/macroTracking/pages/HomePage.Skeletons.tsx](frontend/src/features/macroTracking/pages/HomePage.Skeletons.tsx:1)

import { CardContainer } from '@/components/form';

/**
 * Skeleton shown while AddEntryForm is loading.
 * Markup and classes identical to inline component previously in
 * [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:251).
 */
export const AddEntryLoadingSkeleton = () => (
  <CardContainer>
    <div className="animate-pulse p-5">
      <div className="mb-4 h-4 w-1/2 rounded bg-surface"></div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-8 rounded bg-surface"></div>
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
      <div className="mb-4 h-5 w-1/2 rounded bg-surface"></div>
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-12 rounded bg-surface"></div>
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
    <div className="mb-6 h-6 w-1/4 rounded bg-surface"></div>
    {[0, 1, 2].map((index) => (
      <div key={index} className="space-y-2">
        <div className="h-5 w-1/6 rounded bg-surface"></div>
        <div className="h-16 rounded bg-surface/50"></div>
      </div>
    ))}
  </div>
);
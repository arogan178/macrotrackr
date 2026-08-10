import { memo } from "react";

import { StarIcon, UserIcon } from "@/components/ui";
import MetricCard from "@/components/ui/MetricCard";

interface UserMetricsPanelProps {
  bmr: number;
  tdee: number;
  isLoading?: boolean;
}

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="flex h-32 sm:h-40 animate-pulse flex-col justify-between rounded-2xl border border-border/60 bg-surface p-3.5 sm:p-5"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="rounded-2xl border border-border/40 bg-surface-2 p-2.5 sm:p-3.5">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-surface-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 h-3.5 sm:h-4 w-3/4 rounded bg-surface-2" />
              <div className="h-6 sm:h-8 w-2/5 rounded bg-surface-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

function formatOrUndefined(n?: number) {
  return n ?? undefined;
}

function UserMetricsPanel({
  bmr,
  tdee,
  isLoading = false,
}: UserMetricsPanelProps) {
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <MetricCard
        icon={UserIcon}
        title="Basal Metabolic Rate"
        acronym="BMR"
        value={formatOrUndefined(bmr)}
        color="primary"
        showKcalSuffix
      />
      <MetricCard
        icon={StarIcon}
        title="Total Daily Energy"
        acronym="TDEE"
        value={formatOrUndefined(tdee)}
        color="primary"
        showKcalSuffix
      />
    </div>
  );
}

export default memo(UserMetricsPanel);

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
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-border/50 bg-surface/70 p-5 shadow-modal backdrop-blur-sm"
        >
          <div className="flex items-start gap-5">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 p-3">
              <div className="h-7 w-7 rounded bg-surface" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 h-4 w-3/4 rounded bg-surface" />
              <div className="h-7 w-2/5 rounded bg-surface" />
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
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

import { memo } from "react";

import { StarIcon, UserIcon } from "@/components/ui";
import MetricCard from "@/components/ui/MetricCard";

interface UserMetricsPanelProps {
  bmr: number;
  tdee: number;
  isLoading?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="bg-surface/70 backdrop-blur-sm p-5 rounded-2xl border border-border/50 shadow-modal animate-pulse"
        >
          <div className="flex items-start gap-5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <div className="h-7 w-7 bg-surface rounded"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-surface rounded w-3/4 mb-2"></div>
              <div className="h-7 bg-surface rounded w-2/5"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserMetricsPanel({
  bmr,
  tdee,
  isLoading = false,
}: UserMetricsPanelProps) {
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <MetricCard
        icon={UserIcon}
        title="Basal Metabolic Rate"
        acronym="BMR"
        value={bmr || undefined}
        color="accent"
        showKcalSuffix
      />
      <MetricCard
        icon={StarIcon}
        title="Total Daily Energy"
        acronym="TDEE"
        value={tdee || undefined}
        color="accent"
        showKcalSuffix
      />
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(UserMetricsPanel);

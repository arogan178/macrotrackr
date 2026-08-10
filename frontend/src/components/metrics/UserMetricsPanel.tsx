import { memo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { StarIcon, UserIcon } from "@/components/ui";
import MetricCard from "@/components/ui/MetricCard";

interface UserMetricsPanelProps {
  bmr: number;
  tdee: number;
  isLoading?: boolean;
}

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2 sm:hidden">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="flex flex-1 h-8 animate-pulse items-center justify-between rounded-full border border-border/60 bg-surface px-3 py-1.5"
          >
            <div className="h-3 w-10 rounded bg-surface-2" />
            <div className="h-3 w-12 rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="flex h-40 animate-pulse flex-col justify-between rounded-2xl border border-border/60 bg-surface p-5"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-border/40 bg-surface-2 p-3.5">
                <div className="h-6 w-6 rounded bg-surface-3" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 h-4 w-3/4 rounded bg-surface-2" />
                <div className="h-8 w-2/5 rounded bg-surface-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
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

  const metrics = [
    { label: "BMR", value: bmr, icon: UserIcon, iconClass: "text-primary" },
    { label: "TDEE", value: tdee, icon: StarIcon, iconClass: "text-primary" },
  ];

  return (
    <>
      <div className="flex items-center gap-2 sm:hidden">
        {metrics.map(({ label, value, icon: Icon, iconClass }) => (
          <div
            key={label}
            className="flex flex-1 items-center justify-between gap-2 rounded-full border border-border/60 bg-surface px-3.5 py-1.5 shadow-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground">{label}</span>
            </div>
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {value ? (
                <AnimatedNumber value={value} toFixedValue={0} suffix=" kcal" duration={0.8} />
              ) : (
                "—"
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
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
    </>
  );
}

export default memo(UserMetricsPanel);

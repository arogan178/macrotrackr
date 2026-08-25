import { memo } from "react";

import { StarIcon, UserIcon } from "@/components/ui";
import MetricCard from "@/components/ui/MetricCard";
import { formatGrouped } from "@/lib/formatNumber";

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
            className="flex flex-1 h-8 animate-pulse items-center justify-between rounded-full border border-border bg-surface px-3 py-1.5"
          >
            <div className="h-3 w-10 rounded-control bg-surface-2" />
            <div className="h-3 w-12 rounded-control bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="hidden sm:grid grid-cols-2 gap-3.5">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="animate-pulse rounded-card border border-border bg-surface p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="h-3 w-12 rounded-control bg-surface-2" />
              <div className="h-3.5 w-3.5 rounded-control bg-surface-2" />
            </div>
            <div className="mb-1 h-6 w-20 rounded-control bg-surface-2" />
            <div className="h-2.5 w-14 rounded-control bg-surface-2" />
          </div>
        ))}
      </div>
    </>
  );
});

function UserMetricsPanel({
  bmr,
  tdee,
  isLoading = false,
}: UserMetricsPanelProps) {
  if (isLoading) return <LoadingSkeleton />;

  const metrics = [
    {
      label: "BMR",
      meaning: "at rest",
      value: bmr,
      icon: UserIcon,
      iconClass: "text-primary",
    },
    {
      label: "TDEE",
      meaning: "with activity",
      value: tdee,
      icon: StarIcon,
      iconClass: "text-primary",
    },
  ];

  return (
    <>
      <div className="flex items-center gap-2 sm:hidden">
        {metrics.map(({ label, value, icon: Icon, iconClass }) => (
          <div
            key={label}
            className="flex flex-1 items-center justify-between gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 shadow-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${iconClass}`}
                strokeWidth={1.5}
              />
              <span className="text-xs font-medium text-foreground">
                {label}
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">
              {value ? `${formatGrouped(value)} kcal` : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Two cards, as before. What truncated was never the layout — it was
          spelling out "Basal Metabolic Rate (BMR)" in a third-width column.
          The acronyms are the names people actually use for these, and the
          subtitle says what they mean without competing for the line. */}
      <div className="hidden sm:grid grid-cols-2 gap-3.5">
        {metrics.map(({ label, meaning, value, icon }) => (
          <MetricCard
            key={label}
            icon={icon}
            title={label}
            subtitle={meaning}
            value={value || undefined}
            tone="primary"
            unit="kcal"
            size="compact"
          />
        ))}
      </div>
    </>
  );
}

export default memo(UserMetricsPanel);

import { memo, useMemo } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import Heading from "@/components/ui/Heading";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import Panel from "@/components/ui/Panel";
import { cn } from "@/lib/classnameUtilities";
import { formatGrouped } from "@/lib/formatNumber";

/**
 * Five real meanings, each mapping to a declared token. This replaces
 * COLOR_MAP, whose ten entries were identical apart from an icon tint and
 * half of whose borders pointed at tokens that did not exist.
 */
export type MetricTone = "neutral" | "primary" | "protein" | "carbs" | "fats";

const TONE_TEXT: Record<MetricTone, string> = {
  neutral: "text-muted",
  primary: "text-primary",
  protein: "text-protein",
  carbs: "text-carbs",
  fats: "text-fats",
};

export interface MetricCardProps {
  title: string;
  value?: number | string;
  /** Always adjacent to the value, always muted, always the same spelling. */
  unit?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  subtitle?: string;
  tooltipText?: string;
  tone?: MetricTone;
  /** 0–100. Renders the dot Analytics uses to grade a metric. */
  score?: number;
  /** Count the value up on mount. One per screen, at most. */
  animateValue?: boolean;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
  size?: "default" | "compact";
}

const scoreToneClass = (score: number): string => {
  if (score >= 80) return "bg-primary";
  if (score >= 50) return "bg-warning";

  return "bg-error";
};

function MetricCardInner({
  title,
  value,
  unit,
  icon: Icon,
  subtitle,
  tooltipText,
  tone = "neutral",
  score,
  animateValue = false,
  delay = 0,
  className,
  children,
  size = "default",
}: MetricCardProps) {
  const numericValue = useMemo(() => {
    if (value === undefined) return undefined;

    return typeof value === "number" ? value : Number.parseFloat(value);
  }, [value]);

  const isCompact = size === "compact";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
      className={cn("h-full", className)}
    >
      <Panel
        padding={isCompact ? "none" : "regular"}
        className={cn("flex h-full flex-col", isCompact && "p-3")}
      >
        <div
          className={cn(
            "flex items-start justify-between gap-2",
            isCompact ? "mb-1" : "mb-2",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Heading
              level="panel"
              as="h3"
              className={cn(
                "truncate",
                isCompact ? "text-xs font-medium" : "text-sm",
              )}
            >
              {title}
            </Heading>
            {tooltipText ? <InfoTooltip text={tooltipText} /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {Icon ? (
              <Icon
                className={cn(
                  isCompact ? "h-3.5 w-3.5" : "h-4 w-4",
                  TONE_TEXT[tone],
                )}
                strokeWidth={1.5}
              />
            ) : null}
            {score === undefined ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  scoreToneClass(score),
                )}
              />
            )}
          </div>
        </div>

        {numericValue === undefined ? (
          children ? null : (
            <p className="text-sm text-muted">Complete profile</p>
          )
        ) : isCompact ? (
          <div className="flex items-baseline justify-between gap-2">
            <p className="flex items-baseline gap-1">
              <span className="text-xl font-light tracking-tight tabular-nums">
                {animateValue ? (
                  <AnimatedNumber
                    value={numericValue}
                    toFixedValue={0}
                    duration={0.8}
                  />
                ) : (
                  formatGrouped(numericValue)
                )}
              </span>
              {unit ? <span className="text-xs text-muted">{unit}</span> : null}
            </p>
            {subtitle ? (
              <span className="text-[11px] text-muted">{subtitle}</span>
            ) : null}
          </div>
        ) : (
          <>
            <p className="flex items-baseline gap-1.5">
              <span className="text-3xl font-light tracking-tight tabular-nums">
                {animateValue ? (
                  <AnimatedNumber
                    value={numericValue}
                    toFixedValue={0}
                    duration={0.8}
                  />
                ) : (
                  formatGrouped(numericValue)
                )}
              </span>
              {unit ? <span className="text-sm text-muted">{unit}</span> : null}
            </p>
            {/* The subtitle used to sit on the value's own line with `ml-auto`,
                which pushed it hard right and wrapped it to two ragged lines in a
                narrow card. It qualifies the number, so it belongs under it. */}
            {subtitle ? (
              <p className="mt-1 text-xs text-muted">{subtitle}</p>
            ) : null}
          </>
        )}

        {children ? (
          <div className="flex flex-1 flex-col justify-between">{children}</div>
        ) : null}
      </Panel>
    </motion.div>
  );
}

const MetricCard = memo(MetricCardInner);
export default MetricCard;

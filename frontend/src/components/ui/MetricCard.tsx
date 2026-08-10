import { memo, useMemo } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { COLOR_MAP } from "@/components/utils";
import { cn } from "@/lib/classnameUtilities";

export interface MetricCardProps {
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: number | string | undefined;
  acronym?: string;
  subtitle?: string;
  score?: number;
  color?: keyof typeof COLOR_MAP;
  bgGradient?: string;
  borderColor?: string;
  textColor?: string;
  delay?: number;
  children?: React.ReactNode;
  className?: string;
  showKcalSuffix?: boolean;
}

type ColorClasses = Partial<(typeof COLOR_MAP)[keyof typeof COLOR_MAP]>;

const EMPTY_COLOR_CLASSES: ColorClasses = {};

function useMetricCardColors(color: keyof typeof COLOR_MAP | undefined) {
  return useMemo(
    () => (color ? COLOR_MAP[color] : EMPTY_COLOR_CLASSES),
    [color],
  );
}

function useNumericValue(value: number | string | undefined) {
  return useMemo(() => {
    if (value === undefined) return undefined;

    return typeof value === "number"
      ? value
      : Number.parseFloat(value.toString());
  }, [value]);
}

function MetricCardInner(properties: MetricCardProps) {
  const {
    icon: Icon,
    title,
    value,
    acronym,
    subtitle,
    score,
    color,
    bgGradient,
    borderColor,
    textColor,
    delay = 0,
    children,
    className = "",
    showKcalSuffix = false,
  } = properties;

  const colorClasses = useMetricCardColors(color);
  const numericValue = useNumericValue(value);

  const baseClasses = cn(
    "group relative flex flex-col transition-colors duration-200 ease-in-out",
    "overflow-hidden rounded-2xl border border-border/60 bg-surface p-5",
    "hover:border-white/20",
    bgGradient,
    borderColor,
    className,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={baseClasses}
    >
      <div className="relative z-10 flex items-start gap-4">
        {Icon && (
          <div
            className={cn(
              "rounded-xl border border-border/40 bg-surface-2 p-2.5 sm:p-3.5 shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0",
              colorClasses.gradient,
              colorClasses.border ?? borderColor,
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                colorClasses.text ?? textColor ?? "text-foreground/80",
              )}
              strokeWidth={1.5}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-1.5">
            <h3
              className={cn(
                "truncate text-xs sm:text-sm font-medium text-foreground",
                textColor,
              )}
            >
              {title}
            </h3>
            {acronym && (
              <span
                className={cn(
                  "text-xs whitespace-nowrap sm:inline hidden",
                  colorClasses.acronym ?? textColor,
                )}
              >
                ({acronym})
              </span>
            )}
          </div>
          <p className="text-xl sm:text-3xl font-light tracking-tight text-foreground">
            {numericValue === undefined ? (
              <span className="text-base text-muted">Complete profile</span>
            ) : (
              <span className="text-foreground">
                <AnimatedNumber
                  value={numericValue}
                  toFixedValue={0}
                  suffix={showKcalSuffix ? " kcal" : ""}
                  duration={0.8}
                />
              </span>
            )}
            {subtitle && (
              <span className={cn("ml-2 text-xs", textColor)}>{subtitle}</span>
            )}
          </p>
        </div>
      </div>

      {score !== undefined && (
        <div className="relative z-10 mb-2 flex items-center justify-between" />
      )}

      {children && (
        <div className="relative z-10 flex flex-1 flex-col justify-between">
          {children}
        </div>
      )}
    </motion.div>
  );
}

const MetricCard = memo(MetricCardInner);
export default MetricCard;

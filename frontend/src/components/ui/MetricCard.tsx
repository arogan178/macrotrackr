import { memo, useMemo } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { COLOR_MAP } from "@/components/utils";
import { cn } from "@/lib/classnameUtilities";

import { useCardGlare } from "./hooks";

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
  enableGlare?: boolean;
}

type ColorClasses = Partial<(typeof COLOR_MAP)[keyof typeof COLOR_MAP]>;

function useMetricCardColors(color: keyof typeof COLOR_MAP | undefined) {
  return useMemo(
    () =>
      color
        ? COLOR_MAP[color]
        : ({} as ColorClasses),
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
    enableGlare = false,
  } = properties;

  const { cardRef, cardStyle, glareStyle, handlers } = useCardGlare({
    maxRotation: 8,
    scale: 1.02,
    glareIntensity: 0.12,
    enableGlare,
    enableRotation: enableGlare,
  });

  const colorClasses = useMetricCardColors(color);
  const numericValue = useNumericValue(value);
  const hasMotion = score !== undefined || delay > 0 || enableGlare;

  const baseClasses = cn(
    "group relative flex flex-col transition-colors duration-200 ease-in-out",
    "overflow-hidden rounded-2xl border border-border/60 bg-surface",
    "hover:border-white/20",
    enableGlare ? "p-4" : "p-5",
    bgGradient,
    borderColor,
    className
  );

  const innerContent = (
    <>
      {enableGlare && <div style={glareStyle} />}

      <div
        className={cn(
          "relative z-10 flex items-start",
          enableGlare ? "gap-5" : "gap-4"
        )}
      >
        {Icon && (
          <div
              className={cn(
                "rounded-2xl border border-border/40 bg-surface-2 shadow-sm transition-transform duration-300 group-hover:scale-105",
                enableGlare ? "p-3" : "p-3.5",
                colorClasses.gradient,
                colorClasses.border ?? borderColor
              )}
          >
            <Icon
              className={cn(
                enableGlare ? "h-7 w-7" : "h-6 w-6",
                colorClasses.text ?? textColor ?? "text-foreground/80"
              )}
              strokeWidth={1.5}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2">
            <h3
              className={cn(
                "truncate text-sm font-medium",
                enableGlare ? "text-foreground/80" : "text-foreground",
                textColor
              )}
            >
              {title}
            </h3>
            {acronym && (
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  colorClasses.acronym ?? textColor
                )}
              >
                ({acronym})
              </span>
            )}
          </div>
          <p className="text-3xl font-light tracking-tight text-foreground">
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
    </>
  );

  if (hasMotion) {
    return (
      <motion.div
        ref={cardRef}
        style={cardStyle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className={baseClasses}
        {...(enableGlare ? handlers : {})}
      >
        {innerContent}
      </motion.div>
    );
  }

  return (
    <div ref={cardRef} className={baseClasses}>
      {innerContent}
    </div>
  );
}

const MetricCard = memo(MetricCardInner);
export default MetricCard;

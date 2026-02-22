import { motion } from "motion/react";
import { memo, useMemo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
import { COLOR_MAP } from "@/components/utils";

import { useCardGlare } from "./hooks";

// Optional: import getScoreColor if needed for reporting
// import { getScoreColor } from "@/features/reporting/utils/insightsCalculations";

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
  /** Enable 3D glare effect on hover */
  enableGlare?: boolean;
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

  // Initialize glare effect hook
  const { cardRef, cardStyle, glareStyle, handlers } = useCardGlare({
    maxRotation: 8,
    scale: 1.02,
    glareIntensity: 0.12,
    enableGlare,
    enableRotation: enableGlare,
  });

  // Memoize color classes for icon with safe fallbacks for optional keys
  const colorClasses = useMemo(
    () =>
      color
        ? COLOR_MAP[color]
        : ({} as Partial<(typeof COLOR_MAP)[keyof typeof COLOR_MAP]>),
    [color],
  );

  // Memoize parsed numeric value for AnimatedNumber
  const numericValue = useMemo(() => {
    if (value === undefined) return undefined;
    return typeof value === "number"
      ? value
      : Number.parseFloat(value.toString());
  }, [value]);

  // Memoize wrapper component and props
  const wrapperConfig = useMemo(() => {
    const useMotion = score !== undefined || delay > 0;
    return {
      Wrapper: useMotion ? motion.div : CardContainer,
      wrapperProps: useMotion
        ? {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay },
            className: `bg-surface rounded-xl border border-border overflow-hidden ${bgGradient ?? ""} p-4 ${borderColor ?? ""} h-40 flex flex-col group transition-colors duration-150 hover:border-border-2 hover:bg-surface-2 ${className}`,
          }
        : {
            className: `p-3.5 hover:bg-surface-2 hover:border-border-2 transition-colors duration-150 group ${className}`,
          },
    };
  }, [score, delay, bgGradient, borderColor, className]);

  // If glare is enabled, always use motion.div with glare wrapper
  if (enableGlare) {
    return (
      <motion.div
        ref={cardRef}
        style={cardStyle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className={`relative overflow-hidden rounded-xl border border-border bg-surface ${bgGradient ?? ""} ${borderColor ?? ""} group flex h-40 flex-col p-4 transition-colors duration-150 hover:border-border-2 ${className}`}
        {...handlers}
      >
        {/* Glare overlay */}
        <div style={glareStyle} />

        {/* Content */}
        <div className="relative z-10 flex items-start gap-5">
          {Icon && (
            <div
              className={`rounded-xl bg-linear-to-br p-3 ${colorClasses?.gradient ?? ""} border ${colorClasses?.border ?? borderColor ?? ""}`}
            >
              <Icon
                className={`h-7 w-7 ${colorClasses?.text ?? textColor ?? ""}`}
                strokeWidth={1.5}
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline gap-2">
              <h3
                className={`truncate text-sm font-medium text-foreground ${textColor ?? ""}`}
              >
                {title}
              </h3>
              {acronym && (
                <span
                  className={`text-xs whitespace-nowrap ${colorClasses?.acronym ?? textColor ?? ""}`}
                >
                  ({acronym})
                </span>
              )}
            </div>
            <p className="text-2xl font-light tracking-tight text-foreground">
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
                <span className={`ml-2 text-xs ${textColor ?? ""}`}>
                  {subtitle}
                </span>
              )}
            </p>
          </div>
        </div>
        {/* Score dot for reporting */}
        {score !== undefined && (
          <div className="relative z-10 mb-2 flex items-center justify-between">
            {/* <div className={`h-2 w-2 rounded-full ${getScoreColor(score)}`} /> */}
          </div>
        )}
        {/* Children for extra content */}
        {children && (
          <div className="relative z-10 flex flex-1 flex-col justify-between">
            {children}
          </div>
        )}
      </motion.div>
    );
  }

  const { Wrapper, wrapperProps } = wrapperConfig;

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex items-start gap-5">
        {Icon && (
          <div
            className={`rounded-xl bg-linear-to-br p-3 ${colorClasses?.gradient ?? ""} border ${colorClasses?.border ?? borderColor ?? ""}`}
          >
            <Icon
              className={`h-7 w-7 ${colorClasses?.text ?? textColor ?? ""}`}
              strokeWidth={1.5}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2">
            <h3
              className={`truncate text-sm font-medium text-foreground ${textColor ?? ""}`}
            >
              {title}
            </h3>
            {acronym && (
              <span
                className={`text-xs whitespace-nowrap ${colorClasses?.acronym ?? textColor ?? ""}`}
              >
                ({acronym})
              </span>
            )}
          </div>
          <p className="text-2xl font-light tracking-tight text-foreground">
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
              <span className={`ml-2 text-xs ${textColor ?? ""}`}>
                {subtitle}
              </span>
            )}
          </p>
        </div>
      </div>
      {/* Score dot for reporting */}
      {score !== undefined && (
        <div className="mb-2 flex items-center justify-between">
          {/* <div className={`h-2 w-2 rounded-full ${getScoreColor(score)}`} /> */}
        </div>
      )}
      {/* Children for extra content */}
      {children && (
        <div className="flex flex-1 flex-col justify-between">{children}</div>
      )}
    </Wrapper>
  );
}

// Wrap with React.memo for performance optimization
const MetricCard = memo(MetricCardInner);

export default MetricCard;

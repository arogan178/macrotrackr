import { motion } from "motion/react";
import CardContainer from "@/components/form/CardContainer";
import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { COLOR_MAP } from "@/components/utils";

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
}

export default function MetricCard(props: MetricCardProps) {
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
  } = props;

  // Resolve color classes for icon
  const colorClasses = color ? COLOR_MAP[color] : {};

  // Use motion.div for animation if delay or score is provided, else CardContainer
  const Wrapper = score !== undefined || delay > 0 ? motion.div : CardContainer;
  const wrapperProps =
    score !== undefined || delay > 0
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay },
          className: `rounded-lg ${bgGradient ?? ""} p-4 ${borderColor ?? ""} h-[160px] flex flex-col ${className}`,
        }
      : {
          className: `p-3.5 hover:bg-surface/80 hover:shadow-accent transition group ${className}`,
        };

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex items-start gap-5">
        {Icon && (
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses.gradient ?? ""} border ${colorClasses.border ?? borderColor ?? ""}`}
          >
            <Icon
              className={`h-7 w-7 ${colorClasses.text ?? textColor ?? ""} transform group-hover:scale-120 transition-transform`}
              strokeWidth={1.5}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3
              className={`font-medium text-foreground text-sm truncate ${textColor ?? ""}`}
            >
              {title}
            </h3>
            {acronym && (
              <span
                className={`text-xs whitespace-nowrap ${colorClasses.acronym ?? textColor ?? ""}`}
              >
                ({acronym})
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-foreground">
            {typeof value !== "undefined" ? (
              <span className="bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                <AnimatedNumber
                  value={
                    typeof value === "number"
                      ? value
                      : Number.parseFloat(value.toString())
                  }
                  toFixedValue={0}
                  suffix={showKcalSuffix ? " kcal" : ""}
                  duration={0.8}
                />
              </span>
            ) : (
              <span className="text-foreground text-lg">Complete profile</span>
            )}
            {subtitle && (
              <span className={`text-xs ml-2 ${textColor ?? ""}`}>
                {subtitle}
              </span>
            )}
          </p>
        </div>
      </div>
      {/* Score dot for reporting */}
      {score !== undefined && (
        <div className="flex items-center justify-between mb-2">
          {/* <div className={`h-2 w-2 rounded-full ${getScoreColor(score)}`} /> */}
        </div>
      )}
      {/* Children for extra content */}
      {children && (
        <div className="flex-1 flex flex-col justify-between">{children}</div>
      )}
    </Wrapper>
  );
}

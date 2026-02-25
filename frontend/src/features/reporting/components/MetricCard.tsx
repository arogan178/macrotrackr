import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";

import type { MetricCardProps as MetricCardProps } from "../types/insightsTypes";
import { getScoreColor } from "../utils/insightsCalculations";

export default function MetricCard({
  title,
  value,
  subtitle,
  score,
  bgGradient,
  borderColor,
  textColor,
  delay = 0,
  children,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`group rounded-2xl ${bgGradient} p-6 ${borderColor} flex h-40 flex-col transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-border-hover hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className={`text-sm font-semibold tracking-tight ${textColor}`}>{title}</h3>
        <div className={`h-2.5 w-2.5 rounded-full ${getScoreColor(score)}`} />
      </div>{" "}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          <AnimatedNumber
            value={
              typeof value === "number"
                ? value
                : Number.parseFloat(value.toString())
            }
            toFixedValue={0}
            duration={0.8}
          />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{subtitle}</span>
      </div>
      <div className="flex flex-1 flex-col justify-between">{children}</div>
    </motion.div>
  );
}

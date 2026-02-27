import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
import { cn } from "@/lib/classnameUtilities";

import type { MetricCardProps as MetricCardProps } from "../types/insightsTypes";
import { getScoreColor } from "../utils/insightsCalculations";

export default function MetricCard({
  title,
  value,
  subtitle,
  score,
  delay = 0,
  children,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <CardContainer
        variant="interactive"
        className="group flex h-40 flex-col p-6"
      >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground/90">{title}</h3>
        <div className={cn("h-2.5 w-2.5 rounded-full shadow-sm", getScoreColor(score))} />
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
        <span className="text-xs font-medium tracking-wider text-muted uppercase">{subtitle}</span>
      </div>
      <div className="flex flex-1 flex-col justify-between">{children}</div>
      </CardContainer>
    </motion.div>
  );
}

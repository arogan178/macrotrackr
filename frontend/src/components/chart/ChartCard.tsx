import { ReactNode } from "react";
import { motion } from "motion/react";

import CardContainer from "@/components/form/CardContainer";

interface ChartCardProps {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  minHeight?: number;
}

/**
 * ChartCard - A reusable card component for chart visualizations
 * Uses CardContainer for standardized shell while retaining motion fade-in.
 */
function ChartCard({
  title,
  children,
  action,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available.",
  className = "",
  minHeight = 150,
}: ChartCardProps) {
  return (
    // Flat on a phone: the chart's own axes frame it; a box adds nothing.
    <CardContainer
      className={`relative h-full p-3.5 sm:p-6 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 ${className}`}
    >
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-full flex-col"
      >
        {/* Header */}
        {(title ?? action) && (
          <div className="mb-3.5 sm:mb-4 flex flex-wrap items-center justify-between gap-2">
            {title && (
              <h3 className="whitespace-nowrap text-base sm:text-lg font-semibold tracking-tight text-foreground/90">
                {title}
              </h3>
            )}
            {action && <div>{action}</div>}
          </div>
        )}

        {/* Content */}
        <div className="relative flex-1" style={{ minHeight: `${minHeight}px` }}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-foreground">Loading...</div>
            </div>
          ) : isEmpty ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-foreground">{emptyMessage}</div>
            </div>
          ) : (
            children
          )}
        </div>
      </motion.div>
    </CardContainer>
  );
}

export default ChartCard;

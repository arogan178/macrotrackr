import { motion } from "motion/react";
import { ReactNode } from "react";

import { CardContainer } from "@/components/form";

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
    <CardContainer className={`p-3 h-full ${className}`}>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        {(title || action) && (
          <div className="flex items-center justify-between mb-2">
            {title && (
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
            )}
            {action && <div>{action}</div>}
          </div>
        )}

        {/* Content */}
        <div className="flex-1" style={{ minHeight: `${minHeight}px` }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-foreground">Loading...</div>
            </div>
          ) : isEmpty ? (
            <div className="h-full flex items-center justify-center">
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

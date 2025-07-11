import { motion } from "motion/react";
import { ReactNode } from "react";

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
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`bg-gray-800/70 rounded-xl border border-gray-700/30 p-3 shadow-lg h-full flex flex-col ${className}`}
    >
      {/* Header */}
      {(title || action) && (
        <div className="flex items-center justify-between mb-2">
          {title && (
            <h3 className="text-base font-semibold text-white">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className="flex-1" style={{ minHeight: `${minHeight}px` }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : isEmpty ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400">{emptyMessage}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

export default ChartCard;

// src/components/ui/ProgressBar.tsx

import { memo } from "react";

import { PROGRESS_BAR_COLORS, PROGRESS_BAR_HEIGHTS } from "../utils/Constants";

interface ProgressBarProps {
  progress: number; // 0-100
  color?: keyof typeof PROGRESS_BAR_COLORS;
  height?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
}

function ProgressBar({
  progress,
  color = "accent",
  height = "md",
  showPercentage = false,
  className = "",
}: ProgressBarProps) {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full ${PROGRESS_BAR_HEIGHTS[height]} bg-surface/50 rounded-full overflow-hidden`}
      >
        <div
          className={`${PROGRESS_BAR_HEIGHTS[height]} ${
            PROGRESS_BAR_COLORS[color] || PROGRESS_BAR_COLORS.blue
          } rounded-full transition-all duration-500`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      {showPercentage && (
        <div className="absolute right-0 top-0 transform -translate-y-full -translate-x-1 text-xs text-foreground">
          {Math.round(safeProgress)}%
        </div>
      )}
    </div>
  );
}

export default memo(ProgressBar);

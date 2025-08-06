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
      {/* Higher-contrast track so the fill remains visible on bg-surface */}
      <div
        className={`w-full ${PROGRESS_BAR_HEIGHTS[height]} overflow-hidden rounded-full border border-border/40 bg-foreground/[0.08] backdrop-blur-[0.5px]`}
      >
        {/* Slight gradient + glow for the fill to pop on dark/light surfaces */}
        <div
          className={`${PROGRESS_BAR_HEIGHTS[height]} ${
            PROGRESS_BAR_COLORS[color] || PROGRESS_BAR_COLORS.blue
          } rounded-full bg-gradient-to-r from-white/10 to-transparent shadow-[0_0_8px_rgba(0,0,0,0.15)] transition-all duration-500`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      {showPercentage && (
        <div className="absolute top-0 right-0 -translate-x-1 -translate-y-full transform text-xs text-foreground">
          {Math.round(safeProgress)}%
        </div>
      )}
    </div>
  );
}

export default memo(ProgressBar);

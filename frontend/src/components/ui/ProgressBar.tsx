import { memo } from "react";

const PROGRESS_BAR_COLORS = {
  blue: "bg-surface",
  green: "bg-success",
  red: "bg-error",
  accent: "bg-vibrant-accent",
  purple: "bg-secondary",
  protein: "bg-protein",
  carbs: "bg-carbs",
  fats: "bg-fats",
} as const;

const PROGRESS_BAR_HEIGHTS = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
} as const;

interface ProgressBarProps {
  progress: number; // 0-100
  color?: keyof typeof PROGRESS_BAR_COLORS;
  height?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
  fillClass?: string;
}

function ProgressBar({
  progress,
  color = "accent",
  height = "md",
  showPercentage = false,
  className = "",
  fillClass,
}: ProgressBarProps) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  const barHeight =
    PROGRESS_BAR_HEIGHTS[height as keyof typeof PROGRESS_BAR_HEIGHTS] ||
    PROGRESS_BAR_HEIGHTS.md;
  const barColor =
    PROGRESS_BAR_COLORS[color as keyof typeof PROGRESS_BAR_COLORS] ||
    PROGRESS_BAR_COLORS.blue;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full ${barHeight} relative overflow-hidden rounded-full border border-border/40 bg-foreground/[0.08] backdrop-blur-[0.5px]`}
        style={{ minHeight: 4 }}
      >
        {showPercentage && (
          <div className="pointer-events-none absolute inset-0 flex h-full items-center justify-end pr-2 text-xs text-foreground select-none">
            {Math.round(safeProgress)}%
          </div>
        )}

        <div
          className={`absolute top-0 left-0 ${fillClass || barColor} rounded-full bg-gradient-to-r from-white/10 to-transparent shadow-[0_0_8px_rgba(0,0,0,0.15)] transition-all duration-500`}
          style={{
            width: `${safeProgress}%`,
            height: "100%", // no more clipping
          }}
        />
      </div>
    </div>
  );
}

export default memo(ProgressBar);

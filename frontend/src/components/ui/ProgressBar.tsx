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
  const isComplete = safeProgress >= 99.5;

  const barHeight =
    PROGRESS_BAR_HEIGHTS[height as keyof typeof PROGRESS_BAR_HEIGHTS] ||
    PROGRESS_BAR_HEIGHTS.md;
  const barColor =
    PROGRESS_BAR_COLORS[color as keyof typeof PROGRESS_BAR_COLORS] ||
    PROGRESS_BAR_COLORS.blue;

  const fillRoundedClass = isComplete ? "rounded-full" : "rounded-l-full";

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative w-full ${barHeight} overflow-hidden rounded-full bg-foreground/8`}
      >
        {showPercentage && (
          <div className="pointer-events-none absolute inset-0 flex h-full items-center justify-end pr-2 text-xs text-foreground select-none">
            {Math.round(safeProgress)}%
          </div>
        )}

        <div
          className={`absolute top-0 left-0 h-full ${fillClass || barColor} ${fillRoundedClass} transition-[width] duration-500 ease-out`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
}

export default memo(ProgressBar);

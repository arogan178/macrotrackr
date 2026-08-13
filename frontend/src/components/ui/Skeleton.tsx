import { memo } from "react";

import { cn } from "@/lib/classnameUtilities";

interface SkeletonProps {
  className?: string;
  /** Rendered as text lines of decreasing width. */
  lines?: number;
  rounded?: "control" | "card" | "full";
}

const ROUNDED = {
  control: "rounded-control",
  card: "rounded-card",
  full: "rounded-full",
} as const;

/**
 * The one skeleton. Four bespoke skeleton files each drew their own greys and
 * heights, so the loaded content jumped when it arrived — a skeleton should
 * match the height of what replaces it.
 */
function Skeleton({ className, lines, rounded = "control" }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              "h-3 animate-pulse bg-surface-2",
              ROUNDED[rounded],
              index === lines - 1 ? "w-2/3" : "w-full",
              className,
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse bg-surface-2", ROUNDED[rounded], className)}
    />
  );
}

export default memo(Skeleton);

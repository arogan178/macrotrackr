import { memo } from "react";

import { LoadingSpinnerIcon } from "./Icons";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
  /** Centres the spinner in the viewport, for route-level fallbacks. */
  fullScreen?: boolean;
}

function LoadingSpinner({
  size = "md",
  color = "text-primary",
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={
        fullScreen
          ? "flex min-h-dvh flex-col items-center justify-center"
          : "flex flex-col items-center justify-center"
      }
    >
      <LoadingSpinnerIcon
        className={`animate-spin ${sizeClasses[size]} ${color}`}
        aria-hidden="true"
      />

      {label ? (
        <span className="mt-2 text-sm text-foreground">{label}</span>
      ) : (
        <span className="sr-only">Loading...</span>
      )}
    </div>
  );
}

export default memo(LoadingSpinner);

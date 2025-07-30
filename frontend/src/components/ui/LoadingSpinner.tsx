import { memo } from "react";

import { LoadingSpinnerIcon } from "@/components/ui";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
}

function LoadingSpinner({
  size = "md",
  color = "text-primary",
  label,
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <LoadingSpinnerIcon
        className={`animate-spin ${sizeClasses[size]} ${color}`}
      />

      {label && <span className="mt-2 text-sm text-foreground">{label}</span>}
    </div>
  );
}

export default memo(LoadingSpinner);

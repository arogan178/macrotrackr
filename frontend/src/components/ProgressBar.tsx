import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  color?: "blue" | "green" | "red" | "indigo" | "purple";
  height?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
}

const colorMap = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
};

const heightMap = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export default function ProgressBar({
  progress,
  color = "blue",
  height = "md",
  showPercentage = false,
  className = "",
}: ProgressBarProps) {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full ${heightMap[height]} bg-gray-700/50 rounded-full overflow-hidden`}
      >
        <div
          className={`${heightMap[height]} ${colorMap[color]} rounded-full transition-all duration-500`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      {showPercentage && (
        <div className="absolute right-0 top-0 transform -translate-y-full -translate-x-1 text-xs text-gray-400">
          {Math.round(safeProgress)}%
        </div>
      )}
    </div>
  );
}

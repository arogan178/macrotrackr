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

  const getHeightClass = () => {
    switch (height) {
      case "sm":
        return "h-1";
      case "lg":
        return "h-4";
      default:
        return "h-2";
    }
  };

  const getColorClass = () => {
    switch (color) {
      case "red":
        return "bg-red-500";
      case "blue":
        return "bg-blue-500";
      case "green":
        return "bg-green-500";
      default:
        return "bg-indigo-500";
    }
  };

  return (
    <div
      className={`w-full ${getHeightClass()} bg-gray-700/50 rounded-full overflow-hidden`}
    >
      <div
        className={`${getHeightClass()} ${getColorClass()} rounded-full transition-all duration-500`}
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}

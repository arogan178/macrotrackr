export const colorMap = {
  green: {
    bg: "from-green-900/30 to-gray-800/10",
    border: "border-green-500/20",
    text: "text-green-400",
    dot: "bg-green-500",
  },
  blue: {
    bg: "from-blue-900/30 to-gray-800/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    dot: "bg-blue-500",
  },
  red: {
    bg: "from-red-900/30 to-gray-800/10",
    border: "border-red-500/20",
    text: "text-red-400",
    dot: "bg-red-500",
  },
  indigo: {
    bg: "from-indigo-900/30 to-gray-800/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    dot: "bg-indigo-500",
  },
  purple: {
    bg: "from-purple-900/30 to-gray-800/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    dot: "bg-purple-500",
  },
} as const;

export const BUTTON_VARIANTS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  DANGER: "danger",
  SUCCESS: "success",
  GHOST: "ghost"
} as const;

export const BUTTON_SIZES = {
  SM: "sm",
  MD: "md",
  LG: "lg"
} as const;

export const ICON_POSITIONS = {
  LEFT: "left",
  RIGHT: "right"
} as const;

export const DEFAULT_LOADING_TEXT = "Processing...";

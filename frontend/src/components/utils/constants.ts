// Tailwind color mapping for various UI components
export const COLOR_MAP = {
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

// Progress bar colors
export const PROGRESS_BAR_COLORS = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
} as const;

// Progress bar height variants
export const PROGRESS_BAR_HEIGHTS = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
} as const;

// Default macro colors
export const MACRO_COLORS = {
  protein: {
    color: "bg-green-500",
    bgColor: "bg-green-500/80",
    textColor: "text-green-400",
  },
  carbs: {
    color: "bg-blue-500",
    bgColor: "bg-blue-500/80",
    textColor: "text-blue-400",
  },
  fats: {
    color: "bg-red-500",
    bgColor: "bg-red-500/80",
    textColor: "text-red-400",
  },
} as const;

// Icon size mapping
export const ICON_SIZES = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-7 h-7",
  "2xl": "w-8 h-8",
  "3xl": "w-9 h-9",
  "4xl": "w-10 h-10",
  "5xl": "w-12 h-12",
} as const;

// Button variants
export const BUTTON_VARIANTS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  DANGER: "danger",
  SUCCESS: "success",
  GHOST: "ghost",
} as const;

// Action button size mapping (square, for icon-only buttons)
export const BUTTON_SIZES = {
  sm: "p-1.5 w-8 h-8 aspect-square", // 32px
  md: "p-2 w-9 h-9 aspect-square", // 36px
  lg: "p-2.5 w-10 h-10 aspect-square", // 40px
  xl: "p-3 w-11 h-11 aspect-square", // 44px
  "2xl": "p-4 w-12 h-12 aspect-square", // 48px
  "3xl": "p-5 w-14 h-14 aspect-square", // 56px
  "4xl": "p-6 w-16 h-16 aspect-square", // 64px
  "5xl": "p-7 w-18 h-18 aspect-square", // 72px
} as const;

// Form button size mapping (rectangular, for text/icon buttons)
export const FORM_BUTTON_SIZES = {
  sm: "px-2 py-1 text-xs",
  md: "px-3.5 py-2 text-md",
  lg: "px-5 py-3 text-base",
} as const;

// Icon positions
export const ICON_POSITIONS = {
  LEFT: "left",
  RIGHT: "right",
} as const;

export const DEFAULT_LOADING_TEXT = "Processing...";

export const DATE_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "week", label: "7 Days" },
  { value: "month", label: "30 Days" },
  { value: "3months", label: "90 Days" },
  // { value: "custom", label: "Custom" },
];

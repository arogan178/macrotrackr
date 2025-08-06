// Centralized semantic tokens for shared primitives across the app.
// Component-specific compositions should be colocated within their component files.

// Tailwind color mapping for various UI components (semantic roles)
export const COLOR_MAP = {
  green: {
    bg: "from-success-900/30 to-gray-800/10",
    border: "border-success-500/20",
    text: "text-success",
    dot: "bg-success",
    iconColor: "text-success",
    acronym: "text-muted/80",
    gradient: "from-success-900/30 to-gray-800/10",
  },
  blue: {
    bg: "from-blue/30 to-gray-800/10",
    border: "border-blue/20",
    text: "text-blue",
    dot: "bg-blue",
    iconColor: "text-blue",
    acronym: "text-muted/80",
    gradient: "from-blue/30 to-gray-800/10",
  },
  red: {
    bg: "from-error-900/30 to-gray-800/10",
    border: "border-error-500/20",
    text: "text-error",
    dot: "bg-error",
    iconColor: "text-error",
    acronym: "text-muted/80",
    gradient: "from-error-900/30 to-gray-800/10",
  },
  accent: {
    bg: "from-vibrant-accent/30 to-gray-800/10",
    border: "border-vibrant-accent/20",
    text: "text-vibrant-accent",
    dot: "bg-vibrant-accent",
    iconColor: "text-vibrant-accent",
    acronym: "text-muted/80",
    gradient: "from-vibrant-accent/30 to-gray-800/10",
  },
  indigo: {
    bg: "from-vibrant-accent/30 to-gray-800/10",
    border: "border-vibrant-accent/20",
    text: "text-vibrant-accent",
    dot: "bg-vibrant-accent",
    iconColor: "text-vibrant-accent",
    acronym: "text-muted/80",
    gradient: "from-vibrant-accent/30 to-gray-800/10",
  },
  purple: {
    bg: "from-purple-900/30 to-gray-800/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    dot: "bg-purple-500",
    iconColor: "text-purple-400",
    acronym: "text-muted/80",
    gradient: "from-purple-900/30 to-gray-800/10",
  },
  protein: {
    bg: "from-protein/30 to-gray-800/10",
    border: "border-protein/20",
    text: "text-protein",
    dot: "bg-protein",
    iconColor: "text-protein",
    acronym: "text-muted/80",
    gradient: "from-protein/30 to-gray-800/10",
  },
  carbs: {
    bg: "from-carbs/30 to-gray-800/10",
    border: "border-carbs/20",
    text: "text-carbs",
    dot: "bg-carbs",
    iconColor: "text-carbs",
    acronym: "text-muted/80",
    gradient: "from-carbs/30 to-gray-800/10",
  },
  fats: {
    bg: "from-fats/30 to-gray-800/10",
    border: "border-fats/20",
    text: "text-fats",
    dot: "bg-fats",
    iconColor: "text-fats",
    acronym: "text-muted/80",
    gradient: "from-fats/30 to-gray-800/10",
  },
} as const;

// Default macro colors
export const MACRO_COLORS = {
  protein: {
    color: "bg-protein",
    bgColor: "bg-protein/80",
    textColor: "text-protein",
  },
  carbs: {
    color: "bg-carbs",
    bgColor: "bg-carbs/80",
    textColor: "text-carbs",
  },
  fats: {
    color: "bg-fats",
    bgColor: "bg-fats/80",
    textColor: "text-fats",
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

// Icon positions
export const ICON_POSITIONS = {
  LEFT: "left",
  RIGHT: "right",
} as const;

// Icon button size mapping (square, for icon-only buttons)
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

// Button size mapping (rectangular, for text/icon buttons)
export const FORM_BUTTON_SIZES = {
  sm: "px-2 py-1 text-xs",
  md: "px-3.5 py-2 text-md",
  lg: "px-5 py-3 text-base",
} as const;

// Default loading text
export const DEFAULT_LOADING_TEXT = "Processing..." as const;
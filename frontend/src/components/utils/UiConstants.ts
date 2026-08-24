// Tailwind color mapping for various UI components
export const COLOR_MAP = {
  green: {
    bg: "bg-surface-2",
    border: "border-success/20",
    text: "text-success",
    dot: "bg-success",
    iconColor: "text-success",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  blue: {
    bg: "bg-surface-2",
    border: "border-carbs/20",
    text: "text-carbs",
    dot: "bg-carbs",
    iconColor: "text-carbs",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  red: {
    bg: "bg-surface-2",
    border: "border-error/20",
    text: "text-error",
    dot: "bg-error",
    iconColor: "text-error",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  accent: {
    bg: "bg-surface-2",
    border: "border-primary/20",
    text: "text-primary",
    dot: "bg-primary",
    iconColor: "text-primary",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  primary: {
    bg: "bg-surface-2",
    border: "border-border",
    text: "text-primary",
    dot: "bg-primary",
    iconColor: "text-primary",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  indigo: {
    bg: "bg-surface-2",
    border: "border-primary/20",
    text: "text-primary",
    dot: "bg-primary",
    iconColor: "text-primary",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  purple: {
    bg: "bg-surface-2",
    border: "border-protein/20",
    text: "text-protein",
    dot: "bg-protein",
    iconColor: "text-protein",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  protein: {
    bg: "bg-surface-2",
    border: "border-protein/20",
    text: "text-protein",
    dot: "bg-protein",
    iconColor: "text-protein",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  carbs: {
    bg: "bg-surface-2",
    border: "border-carbs/20",
    text: "text-carbs",
    dot: "bg-carbs",
    iconColor: "text-carbs",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
  fats: {
    bg: "bg-surface-2",
    border: "border-fats/20",
    text: "text-fats",
    dot: "bg-fats",
    iconColor: "text-fats",
    acronym: "text-muted/80",
    gradient: "bg-surface-2",
  },
} as const;

// Progress bar colors
export const PROGRESS_BAR_COLORS = {
  blue: "bg-surface",
  green: "bg-success",
  red: "bg-error",
  accent: "bg-primary",
  purple: "bg-protein",
  protein: "bg-protein",
  carbs: "bg-carbs",
  fats: "bg-fats",
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
  OUTLINE: "outline",
} as const;

// Icon button size mapping (square, for icon-only buttons).
//
// `min-h-*`/`min-w-*` are not decoration: IconButton renders through Button,
// which contributes `min-h-11` from BUTTON_SIZES. `min-height` and `height` are
// different properties, so tailwind-merge cannot collapse them and `h-9` lost
// to `min-h-11` — every icon button computed 36w x 44h and `rounded-full` drew
// that as a vertical ellipse. Pinning both axes keeps a circle a circle.
//
// `md` is the default and therefore meets the same 44px touch floor as
// BUTTON_SIZES. `sm` is the dense in-row exception, never a primary action.
export const ICON_BUTTON_SIZES = {
  sm: "p-2 w-9 h-9 min-w-9 min-h-9", // 36px
  md: "p-2.5 w-11 h-11 min-w-11 min-h-11", // 44px
  lg: "p-3 w-12 h-12 min-w-12 min-h-12", // 48px
} as const;

// Button size mapping (rectangular, for text/icon buttons).
// The 44px touch minimum lives here rather than being bolted on per call site:
// `sm` used to render 30px tall, which is why a dozen callers hand-wrote
// `min-h-11`. `xs` is deliberately smaller and is for non-touch affordances
// inside a row, never for a primary action.
export const BUTTON_SIZES = {
  xs: "min-h-8 px-2.5 py-1 text-xs",
  sm: "min-h-11 px-3.5 py-2 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
} as const;

// Motion. Three durations and two curves, because 23 durations and 9 ease
// spellings is the same failure as 20 surface fills: call sites inventing a
// value because the system named none.
//
// This product is numbers in, numbers out, read at arm's length mid-meal. The
// only thing motion has to say is "that number changed" — which is `value`,
// and which `AnimatedNumber` owns. `instant` is for a control already under the
// finger. `base` is for something the user asked to appear. Nothing else gets a
// duration, and nothing animates position: travel reflows the text being read.
export const DURATIONS = {
  instant: 0.12,
  base: 0.2,
  value: 0.45,
} as const;

// `modal` is the sheet curve and belongs to the sheet; everything else entering
// uses `out`.
//
// These are the JS curves, and they live here rather than in style.css because
// motion takes a control-point array and a CSS variable cannot supply one. The
// comment here used to claim they mirrored `--ease-out` / `--ease-modal`;
// `--ease-out` has never existed, and adding it to the `@theme` block would
// redefine Tailwind's own `ease-out` utility under all ~16 call sites that use
// it. `--ease-modal` does exist and holds the same control points as `modal`,
// so keep the two in step by hand if either moves.
export const EASINGS = {
  out: [0.16, 1, 0.3, 1],
  modal: [0.32, 0.72, 0, 1],
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

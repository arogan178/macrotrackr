/**
 * The one place code reads a design token at runtime.
 *
 * Most UI names a token through a Tailwind class and never needs this. Two
 * consumers cannot: the snapshot PNG, drawn on a canvas that takes colour
 * strings, and the Clerk appearance object, which is handed to a third-party
 * renderer. Both previously carried their own transcription of the palette, and
 * both went stale — the canvas shipped a rose `fats` against the app's yellow,
 * and Clerk still themed the sign-in screens in the pre-Phase-9 green over cool
 * grey surfaces while the app moved to a warm near-black.
 *
 * Reading the live custom properties means a token change in `style.css`
 * reaches them without anyone remembering to look here.
 */

export const TOKEN_NAMES = {
  background: "--color-background",
  surface: "--color-surface",
  surface2: "--color-surface-2",
  surface3: "--color-surface-3",
  border: "--color-border",
  border2: "--color-border-2",
  foreground: "--color-foreground",
  muted: "--color-muted",
  primary: "--color-primary",
  protein: "--color-protein",
  carbs: "--color-carbs",
  fats: "--color-fats",
  success: "--color-success",
  warning: "--color-warning",
  error: "--color-error",
} as const;

export type TokenName = keyof typeof TOKEN_NAMES;
export type DesignTokens = Record<TokenName, string>;

/**
 * Mirrors the declarations in `style.css`. Only reached without a document —
 * tests, SSR, the pre-render pass — so a drift here is invisible in the browser;
 * `designTokens.test.ts` parses the stylesheet and fails if the two disagree.
 */
export const TOKEN_FALLBACK: DesignTokens = {
  background: "#0c0a09",
  surface: "#141211",
  surface2: "#1b1917",
  surface3: "#2b2724",
  border: "#2b2724",
  border2: "#55504a",
  foreground: "#ffffff",
  muted: "#aba49c",
  primary: "#57c04a",
  protein: "#34d399",
  carbs: "#60a5fa",
  fats: "#facc15",
  success: "#57c04a",
  warning: "#f97316",
  error: "#e91429",
};

export function resolveTokens(): DesignTokens {
  if (typeof document === "undefined" || !document.documentElement) {
    return TOKEN_FALLBACK;
  }

  const computed = getComputedStyle(document.documentElement);
  const names = Object.entries(TOKEN_NAMES) as [TokenName, string][];

  return names.reduce(
    (tokens, [key, property]) => {
      tokens[key] = computed.getPropertyValue(property).trim() || TOKEN_FALLBACK[key];

      return tokens;
    },
    { ...TOKEN_FALLBACK },
  );
}

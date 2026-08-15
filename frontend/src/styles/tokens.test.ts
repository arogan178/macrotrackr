import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Tailwind v4 emits no rule for an undefined token, so a class like
// `text-muted-foreground` silently renders as the inherited colour instead of
// failing loudly. This walks the source for colour utilities and checks every
// one of them resolves — either to a token declared in style.css or to a
// shaded colour from Tailwind's default palette.

const SOURCE_ROOT = path.resolve(process.cwd(), "src");
const STYLE_SHEET = path.join(SOURCE_ROOT, "style.css");

const COLOR_UTILITY_PREFIXES = [
  "text",
  "bg",
  "border",
  "ring",
  "fill",
  "stroke",
  "from",
  "to",
  "via",
  "outline",
  "accent",
  "caret",
  "divide",
  "shadow",
  "placeholder",
];

// Tailwind ships these as families: they are only valid with a numeric shade.
const PALETTE_FAMILIES = new Set([
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]);

// Keywords that are valid on their own for at least one of the prefixes above.
const KEYWORDS = new Set([
  "black",
  "white",
  "transparent",
  "current",
  "inherit",
  "none",
  "auto",
]);

const readTokens = (): { colors: Set<string>; shadows: Set<string> } => {
  const css = readFileSync(STYLE_SHEET, "utf8");
  const colors = new Set<string>();
  const shadows = new Set<string>();
  for (const match of css.matchAll(/--color-([\da-z-]+):/g)) colors.add(match[1]);
  for (const match of css.matchAll(/--shadow-([\da-z-]+):/g)) shadows.add(match[1]);

  return { colors, shadows };
};

// Names that are unmistakably design tokens rather than layout keywords. A bare
// one of these that is not declared emits nothing at all — which is how
// `bg-secondary` and `shadow-success` survived: neither is a palette family,
// neither is shaded, and neither ends in `-foreground`, so the three shape
// rules below never looked at them.
const SEMANTIC_NAMES = new Set([
  "primary", "secondary", "tertiary", "accent", "brand",
  "success", "warning", "error", "danger", "info",
  "surface", "surface-2", "surface-3", "surface-4",
  "background", "foreground", "muted", "subtle", "hint",
  "border", "border-2", "protein", "carbs", "fats",
  "vibrant-accent",
]);

const listSourceFiles = (directory: string): string[] => {
  const entries = readdirSync(directory);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry) && !/\.test\.(tsx|ts)$/.test(entry)) {
      files.push(full);
    }
  }

  return files;
};

const CLASS_TOKEN = new RegExp(
  String.raw`\b(?:hover:|focus:|focus-visible:|active:|disabled:|group-hover:|dark:|sm:|md:|lg:|xl:)*(${COLOR_UTILITY_PREFIXES.join("|")})-([a-z][a-z0-9-]*)(?:\/\d+)?\b`,
  "g",
);

const isColourLike = (value: string, tokens: Set<string>): boolean => {
  if (tokens.has(value) || KEYWORDS.has(value)) return true;

  const shaded = /^([a-z]+)-\d{2,3}$/.exec(value);
  if (shaded && PALETTE_FAMILIES.has(shaded[1])) return true;

  return false;
};

const looksLikeColourUsage = (
  prefix: string,
  value: string,
  tokens: Set<string>,
): boolean => {
  // Only flag values that are shaped like a colour reference: either a bare
  // palette family (invalid without a shade) or a name that collides with a
  // declared token namespace (`*-foreground`, `*-500`, ...).
  if (isColourLike(value, tokens)) return false;
  if (SEMANTIC_NAMES.has(value)) return true;
  if (PALETTE_FAMILIES.has(value)) return true;

  const shaded = /^([a-z-]+)-\d{2,3}$/.exec(value);
  if (shaded) return true;

  return value.endsWith("-foreground");
};

describe("colour tokens", () => {
  const { colors, shadows } = readTokens();
  const tokens = colors;

  it("declares the tokens the app actually uses", () => {
    expect(tokens.has("primary")).toBe(true);
    expect(tokens.has("surface")).toBe(true);
    expect(tokens.has("muted")).toBe(true);
  });

  it("resolves shadow utilities against the shadow namespace, not the colours", () => {
    // `shadow-success` passed for months because `--color-success` exists.
    const offenders: string[] = [];
    for (const file of listSourceFiles(SOURCE_ROOT)) {
      const source = readFileSync(file, "utf8");
      for (const [, value] of source.matchAll(/\bshadow-([a-z][\da-z-]*)\b/g)) {
        if (["sm", "md", "lg", "xl", "2xl", "inner", "none", "xs"].includes(value)) continue;
        if (!shadows.has(value)) {
          offenders.push(`${path.relative(SOURCE_ROOT, file)}: shadow-${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("has no utility class pointing at an undefined colour token", () => {
    const offenders: string[] = [];

    for (const file of listSourceFiles(SOURCE_ROOT)) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(CLASS_TOKEN)) {
        const [, prefix, value] = match;
        if (looksLikeColourUsage(prefix, value, tokens)) {
          offenders.push(
            `${path.relative(SOURCE_ROOT, file)}: ${prefix}-${value}`,
          );
        }
      }
    }

    expect([...new Set(offenders)]).toEqual([]);
  });
});

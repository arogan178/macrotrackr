import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  resolveTokens,
  TOKEN_FALLBACK,
  TOKEN_NAMES,
  type TokenName,
} from "./designTokens";

/** `--color-x: #hex;` out of the stylesheet that actually ships. */
function declaredTokens(): Record<string, string> {
  const css = readFileSync(
    join(import.meta.dirname, "..", "style.css"),
    "utf8",
  );
  const declared: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(
    /(--color-[a-z\d-]+):\s*([^;]+);/g,
  )) {
    declared[name] = value.trim();
  }

  return declared;
}

describe("designTokens", () => {
  const declared = declaredTokens();

  it("names only tokens the stylesheet declares", () => {
    for (const [key, property] of Object.entries(TOKEN_NAMES)) {
      expect(declared[property], `${key} → ${property}`).toBeDefined();
    }
  });

  it("keeps the fallback equal to the stylesheet", () => {
    // This is the test that was missing. Two files transcribed the palette by
    // hand — the snapshot canvas and the Clerk appearance — and both were still
    // on the pre-Phase-9 values months later because nothing compared them to
    // style.css.
    const names = Object.entries(TOKEN_NAMES) as [TokenName, string][];

    for (const [key, property] of names) {
      expect(TOKEN_FALLBACK[key], `${key} (${property})`).toBe(
        declared[property],
      );
    }
  });

  it("resolves every token to a colour", () => {
    for (const [key, value] of Object.entries(resolveTokens())) {
      expect(value, key).toMatch(/^#|^rgb|^oklch|^hsl/);
    }
  });

  it("prefers the live custom property over the fallback", () => {
    document.documentElement.style.setProperty("--color-primary", "#abcdef");

    expect(resolveTokens().primary).toBe("#abcdef");

    document.documentElement.style.removeProperty("--color-primary");
  });
});

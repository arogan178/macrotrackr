import { describe, expect, it } from "vitest";

import { buildClerkAppearance, clerkAppearance } from "./clerkAppearance";
import { resolveTokens, TOKEN_FALLBACK } from "./designTokens";

/**
 * The previous version of this file asserted `colorPrimary` was `#22c55e` and
 * the font family contained `Inter`. Both had been wrong since Phase 9, so the
 * test was not protecting the auth screens — it was holding them at the old
 * palette and failing anyone who fixed them. These assert the invariant instead
 * of the values: whatever the tokens say, Clerk says the same.
 */
describe("clerkAppearance", () => {
  it("takes every colour from the design tokens", () => {
    const tokens = resolveTokens();
    const { variables } = buildClerkAppearance(tokens);

    expect(variables.colorPrimary).toBe(tokens.primary);
    expect(variables.colorBackground).toBe(tokens.surface);
    expect(variables.colorForeground).toBe(tokens.foreground);
    expect(variables.colorError).toBe(tokens.error);
    expect(variables.colorInputBackground).toBe(tokens.surface2);
  });

  it("holds no colour of its own", () => {
    const source = JSON.stringify(buildClerkAppearance(TOKEN_FALLBACK).elements);

    // Element classes name tokens (`bg-surface!`), never arbitrary values.
    expect(source).not.toMatch(/#[\dA-Fa-f]{3,8}/);
    expect(source).not.toMatch(/\[#/);
  });

  it("inherits the app's typeface rather than naming one", () => {
    expect(clerkAppearance.variables.fontFamily).toBe("inherit");
  });

  it("carries no drop shadow", () => {
    // `shadows` is a pinned budget: nothing renders darker than the page.
    const source = JSON.stringify(clerkAppearance.elements);

    expect(source).not.toMatch(/shadow-/);
  });

  it("keeps the hooks Clerk needs", () => {
    expect(clerkAppearance.elements.rootBox).toBe("clerk-root-box");
    expect(clerkAppearance.variables.borderRadius).toBe("0.75rem");
  });
});

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

describe("usePrefersReducedMotion", () => {
  it("returns false by default", () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("can be used in SSR environment", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error - testing SSR
    delete globalThis.window;

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    globalThis.window = originalWindow;
  });
});

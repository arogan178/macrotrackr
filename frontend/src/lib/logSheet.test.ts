import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { openLogSheet, useLogSheet } from "./logSheet";

describe("useLogSheet", () => {
  it("opens on request", () => {
    const { result } = renderHook(() => useLogSheet());
    expect(result.current[0]).toBe(false);

    act(() => openLogSheet());

    expect(result.current[0]).toBe(true);
  });

  it("stays closed with no request", () => {
    const { result } = renderHook(() => useLogSheet());

    expect(result.current[0]).toBe(false);
  });
});

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useHomeHeader } from "./useHomePage";

const title = (
  ...arguments_: Parameters<typeof useHomeHeader>
): string => renderHook(() => useHomeHeader(...arguments_)).result.current.title;

describe("useHomeHeader", () => {
  it("greets a returning user by name", () => {
    expect(title({ firstName: "Andrea" }, false, true)).toBe(
      "Welcome back, Andrea",
    );
  });

  it("does not say 'welcome back' before the first entry is logged", () => {
    expect(title({ firstName: "Andrea" }, false, false)).toBe(
      "Let's log your first meal, Andrea",
    );
  });

  it("omits the name rather than substituting a placeholder", () => {
    expect(title(undefined, false, true)).toBe("Today");
    expect(title({ firstName: "  " }, false, true)).toBe("Today");
    expect(title(undefined, false, false)).toBe("Log your first meal");
  });

  it("shows a neutral title while data is loading", () => {
    expect(title({ firstName: "Andrea" }, true, false)).toBe("Today");
  });
});

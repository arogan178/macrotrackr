import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveHomeDate, useHomeDate, useHomeHeader } from "./useHomePage";

const state = vi.hoisted(() => ({
  search: {} as { date?: string },
  hasProAccess: false,
}));

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => state.search,
}));
vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => ({ hasProAccess: state.hasProAccess }),
}));

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

describe("resolveHomeDate", () => {
  const today = "2026-09-25";

  it("keeps a valid past day", () => {
    expect(resolveHomeDate("2026-09-20", today, undefined)).toBe("2026-09-20");
  });

  it("falls back to today for a missing, malformed or impossible date", () => {
    expect(resolveHomeDate(undefined, today, undefined)).toBe(today);
    expect(resolveHomeDate("yesterday", today, undefined)).toBe(today);
    expect(resolveHomeDate("2026-9-20", today, undefined)).toBe(today);
    expect(resolveHomeDate("2026-02-31", today, undefined)).toBe(today);
  });

  it("falls back to today for a future date", () => {
    expect(resolveHomeDate("2026-09-26", today, undefined)).toBe(today);
  });

  it("falls back to today for a day older than the oldest allowed", () => {
    expect(resolveHomeDate("2026-09-18", today, "2026-09-18")).toBe(
      "2026-09-18",
    );
    expect(resolveHomeDate("2026-09-17", today, "2026-09-18")).toBe(today);
  });
});

describe("useHomeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 25, 12, 0));
    state.search = {};
    state.hasProAccess = false;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const homeDate = () => renderHook(() => useHomeDate()).result.current;

  it("shows today when no date is given", () => {
    expect(homeDate()).toMatchObject({ date: "2026-09-25", isToday: true });
  });

  it("lets a free account open days inside the free history window", () => {
    state.search = { date: "2026-09-18" };

    expect(homeDate()).toMatchObject({
      date: "2026-09-18",
      oldestDate: "2026-09-18",
      isToday: false,
    });
  });

  it("does not let a free account open a day past the free history window", () => {
    state.search = { date: "2026-09-17" };

    expect(homeDate().date).toBe("2026-09-25");
  });

  it("lets a Pro account open any past day", () => {
    state.hasProAccess = true;
    state.search = { date: "2025-01-01" };

    expect(homeDate()).toMatchObject({
      date: "2025-01-01",
      oldestDate: undefined,
    });
  });
});

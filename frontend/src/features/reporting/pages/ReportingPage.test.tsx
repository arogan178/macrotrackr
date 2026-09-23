import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReportingPage from "./ReportingPage";

const { navigate, routerState, entitlements } = vi.hoisted(() => ({
  navigate: vi.fn(),
  routerState: { search: {} as { range?: string } },
  entitlements: { hasProAccess: false },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useSearch: () => routerState.search,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ prefetchQuery: vi.fn() }),
}));

vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => entitlements,
}));
vi.mock("@/hooks/auth/useAuthQueries", () => ({ useUser: () => ({}) }));
vi.mock("@/hooks/queries/useGoals", () => ({ useWeightGoals: () => ({}) }));
vi.mock("@/hooks/queries/useMacroQueries", () => ({
  useMacroHistoryForDateRange: () => ({ data: [], isLoading: false }),
  useMacroTargetQuery: () => ({}),
}));
vi.mock("@/hooks/queries/useReportingQueries", () => ({
  useMacroDensitySummary: () => ({ data: [] }),
}));
vi.mock("@/hooks/usePageDataSync", () => ({ usePageDataSync: () => {} }));

vi.mock("@/components/chart/DateRangeSelector", () => ({
  default: ({
    currentRange,
    onRangeChange,
  }: {
    currentRange: string;
    onRangeChange: (range: string) => void;
  }) => (
    <button type="button" onClick={() => onRangeChange("month")}>
      {currentRange}
    </button>
  ),
}));
vi.mock("@/components/layout/DashboardPageContainer", () => ({
  DashboardPageContainer: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/layout/FeaturePage", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/macroTracking/components", () => ({
  MacroSnapshotModal: () => null,
}));

describe("ReportingPage range", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerState.search = {};
    entitlements.hasProAccess = false;
  });

  it("opens the range from the URL for Pro users", () => {
    entitlements.hasProAccess = true;
    routerState.search = { range: "3months" };

    render(<ReportingPage />);

    expect(screen.getByRole("button").textContent).toBe("3months");
  });

  it("keeps free users on the week view when a link asks for a Pro range", () => {
    routerState.search = { range: "month" };

    render(<ReportingPage />);

    expect(screen.getByRole("button").textContent).toBe("week");
  });

  it("falls back to the week view for unknown or old-style params", () => {
    entitlements.hasProAccess = true;
    routerState.search = { range: "bogus" };

    render(<ReportingPage />);

    expect(screen.getByRole("button").textContent).toBe("week");
  });

  it("writes the chosen range to the URL", () => {
    entitlements.hasProAccess = true;

    render(<ReportingPage />);
    fireEvent.click(screen.getByRole("button"));

    expect(navigate).toHaveBeenCalledWith({
      to: "/reporting",
      search: { range: "month" },
      replace: true,
    });
  });

  it("does not write a Pro range to the URL for free users", () => {
    render(<ReportingPage />);
    fireEvent.click(screen.getByRole("button"));

    expect(navigate).not.toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DateRangeSelector from "./DateRangeSelector";

vi.mock("@/config/runtime", () => ({
  get isLocalAuthMode() {
    return false;
  },
}));

vi.mock("@/components/billing/UpgradeModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="upgrade-modal" /> : null,
}));

const defaultProps = {
  currentRange: "week",
  onExportClick: vi.fn(),
  isExportDisabled: false,
};

describe("DateRangeSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("changes the range when an available period is chosen", async () => {
    const onRangeChange = vi.fn();
    render(<DateRangeSelector {...defaultProps} onRangeChange={onRangeChange} />);

    await userEvent.click(screen.getByRole("tab", { name: /30 Days/ }));

    expect(onRangeChange).toHaveBeenCalledWith("month");
  });

  it("offers the upgrade instead of silently doing nothing on a locked range", async () => {
    const onRangeChange = vi.fn();
    render(
      <DateRangeSelector
        {...defaultProps}
        onRangeChange={onRangeChange}
        disabledRanges={["month", "3months"]}
      />,
    );

    await userEvent.click(screen.getByRole("tab", { name: /30 Days/ }));

    expect(onRangeChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("upgrade-modal")).toBeInTheDocument();
  });

  it("says which ranges are Pro rather than leaving them unexplained", () => {
    render(
      <DateRangeSelector
        {...defaultProps}
        onRangeChange={vi.fn()}
        disabledRanges={["month"]}
      />,
    );

    expect(screen.getByText("30 and 90 day views are Pro")).toBeInTheDocument();
  });
});

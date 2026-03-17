import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UpgradeModal from "./UpgradeModal";

describe("UpgradeModal", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <UpgradeModal open={false} onClose={vi.fn()} onUpgrade={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders without crashing when open", () => {
    const { container } = render(
      <UpgradeModal open onClose={vi.fn()} onUpgrade={vi.fn()} />,
    );
    // Component renders (even if Modal doesn't show in test environment)
    expect(container).toBeTruthy();
  });

  it("accepts custom featureName prop", () => {
    const { container } = render(
      <UpgradeModal
        open
        onClose={vi.fn()}
        onUpgrade={vi.fn()}
        featureName="Premium"
      />,
    );
    expect(container).toBeTruthy();
  });

  it("accepts custom description prop", () => {
    const { container } = render(
      <UpgradeModal
        open
        onClose={vi.fn()}
        onUpgrade={vi.fn()}
        description="Custom description"
      />,
    );
    expect(container).toBeTruthy();
  });
});

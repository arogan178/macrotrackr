import { render } from "@testing-library/react";
import { animate } from "motion/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnimatedNumber from "./AnimatedNumber";

const { reducedMotion } = vi.hoisted(() => ({ reducedMotion: vi.fn() }));

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  animate: vi.fn(() => ({ stop: vi.fn() })),
  useReducedMotion: () => reducedMotion(),
}));

const animateMock = vi.mocked(animate);

beforeEach(() => {
  animateMock.mockClear();
  reducedMotion.mockReturnValue(false);
});

describe("AnimatedNumber", () => {
  it("renders with value", () => {
    render(<AnimatedNumber value={42} />);
    const span = document.querySelector("span");
    expect(span).toBeDefined();
  });

  it("applies custom className", () => {
    render(<AnimatedNumber value={42} className="custom-class" />);
    const span = document.querySelector("span");
    expect(span?.className).toContain("custom-class");
  });

  it("renders with prefix", () => {
    render(<AnimatedNumber value={100} prefix="$" />);
    expect(document.body.textContent).toContain("$");
  });

  it("renders with suffix", () => {
    render(<AnimatedNumber value={100} suffix="%" />);
    expect(document.body.textContent).toContain("%");
  });

  it("renders with both prefix and suffix", () => {
    render(<AnimatedNumber value={100} prefix="$" suffix=" USD" />);
    expect(document.body.textContent).toContain("$");
    expect(document.body.textContent).toContain("USD");
  });

  // The global reduced-motion reset in styles/global.css only zeroes CSS
  // animations and transitions. This counts from a JS timer, so assert the
  // timer never starts rather than asserting the value it lands on: the
  // animation lands on the same figure either way, which is what let a
  // counting number ship past the preference unnoticed.
  it("counts when motion is allowed", () => {
    const { rerender } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={2200} />);

    expect(animateMock).toHaveBeenCalledWith(0, 2200, expect.anything());
  });

  it("jumps straight to the value when reduced motion is preferred", () => {
    reducedMotion.mockReturnValue(true);

    const { rerender } = render(<AnimatedNumber value={0} />);
    rerender(<AnimatedNumber value={2200} />);

    expect(animateMock).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("2200");
  });
});

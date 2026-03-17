import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AnimatedNumber from "./AnimatedNumber";

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
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FEATURES } from "../utils/landingPageConstants";

import FeaturesSection from "./FeaturesSection";

describe("FeaturesSection", () => {
  it("renders every feature once, in a static grid", () => {
    const { container } = render(<FeaturesSection />);

    for (const feature of FEATURES) {
      expect(
        screen.getByRole("heading", { name: feature.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(feature.description)).toBeInTheDocument();
    }

    // The marquee rendered the list twice (once aria-hidden) and scrolled it
    // past the reader, pausing only on hover.
    expect(container.querySelectorAll(".animate-marquee")).toHaveLength(0);
    expect(
      screen.getAllByRole("heading", { name: FEATURES[0].name }),
    ).toHaveLength(1);
  });

  it("exposes the features as a list rather than a carousel", () => {
    render(<FeaturesSection />);

    expect(screen.getByRole("list", { name: "Features" })).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});

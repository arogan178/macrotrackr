import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  TrendIcon,
  GoogleIcon,
  GithubIcon,
  FacebookIcon,
  AppleIcon,
  UserIcon,
  PlusIcon,
} from "./Icons";

describe("Icons", () => {
  describe("TrendIcon", () => {
    it("renders trending up icon when direction is 'up'", () => {
      const { container } = render(<TrendIcon direction="up" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders trending down icon when direction is 'down'", () => {
      const { container } = render(<TrendIcon direction="down" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("returns null for stable direction", () => {
      const { container } = render(<TrendIcon direction="stable" />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for insufficient direction", () => {
      const { container } = render(<TrendIcon direction="insufficient" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Social Icons", () => {
    it("renders GoogleIcon with custom className", () => {
      const { container } = render(<GoogleIcon className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("renders GithubIcon with custom className", () => {
      const { container } = render(<GithubIcon className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("renders FacebookIcon with custom className", () => {
      const { container } = render(<FacebookIcon className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("renders AppleIcon with custom className", () => {
      const { container } = render(<AppleIcon className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("renders with default className when none provided", () => {
      const { container } = render(<GoogleIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute("class")).toBe("");
    });
  });

  describe("Icon wrappers", () => {
    it("renders UserIcon with size prop", () => {
      render(<UserIcon size="lg" data-testid="user-icon" />);
      const icon = screen.getByTestId("user-icon");
      expect(icon).toBeInTheDocument();
    });

    it("renders PlusIcon with custom className", () => {
      render(<PlusIcon className="text-blue-500" data-testid="plus-icon" />);
      const icon = screen.getByTestId("plus-icon");
      expect(icon).toHaveClass("text-blue-500");
    });

    it("applies default size when not specified", () => {
      render(<UserIcon data-testid="default-icon" />);
      const icon = screen.getByTestId("default-icon");
      // Default size is "md" which maps to ICON_SIZES.md
      expect(icon).toBeInTheDocument();
    });

    it("supports different size values", () => {
      const sizes: Array<"sm" | "md" | "lg" | "xl"> = ["sm", "md", "lg", "xl"];
      for (const size of sizes) {
        const { container } = render(<UserIcon size={size} />);
        const icon = container.querySelector("svg");
        expect(icon).toBeInTheDocument();
      }
    });
  });
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BmrCalculatorPage from "../pages/BmrCalculatorPage";
import MacroCalculatorPage from "../pages/MacroCalculatorPage";
import ProteinCalculatorPage from "../pages/ProteinCalculatorPage";
import TdeeCalculatorPage from "../pages/TdeeCalculatorPage";
import ToolsHubPage from "../pages/ToolsHubPage";
import WeightLossCalculatorPage from "../pages/WeightLossCalculatorPage";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/" }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: () => ({ isLoaded: true, isSignedIn: false }),
}));

vi.mock("@/hooks/usePageMetadata", () => ({
  usePageMetadata: vi.fn(),
}));

describe("Free Calculators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BMR Calculator Page", () => {
    it("renders BMR page with default metric units and non-zero BMR burn", () => {
      render(<BmrCalculatorPage />);

      expect(
        screen.getByRole("heading", { name: /bmr calculator/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/your resting burn/i)).toBeInTheDocument();
      // Should show metric weight input by default
      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
      expect(screen.getAllByText(/kg/i).length).toBeGreaterThan(0);
      // Should show Estimated Burn by Activity
      expect(
        screen.getByText(/estimated burn by activity/i),
      ).toBeInTheDocument();
    });

    it("falls back to a placeholder instead of NaN when a stat is cleared", () => {
      render(<BmrCalculatorPage />);

      fireEvent.change(screen.getByLabelText(/^age$/i), {
        target: { value: "" },
      });

      expect(screen.queryByText(/\bNaN\b/)).not.toBeInTheDocument();
      expect(
        screen.getByText(/add your age, weight, and height/i),
      ).toBeInTheDocument();
    });

    it("links to the TDEE calculator for a full daily burn", () => {
      render(<BmrCalculatorPage />);

      expect(
        screen.getByRole("link", { name: /get a full tdee breakdown/i }),
      ).toHaveAttribute("href", "/tools/tdee-calculator");
    });
  });

  describe("TDEE Calculator Page", () => {
    it("renders TDEE page with valid calorie and macro targets by goal", () => {
      render(<TdeeCalculatorPage />);

      expect(
        screen.getByRole("heading", { name: /tdee calculator/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/maintenance calories \(tdee\)/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/calorie & macro targets by goal/i),
      ).toBeInTheDocument();

      // Ensure Fat Loss, Maintenance, and Muscle Gain cards display real non-zero values
      expect(screen.getAllByText(/fat loss/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/maintenance/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/muscle gain/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/\bNaN\b/)).not.toBeInTheDocument();
    });

    it("lets the activity breakdown rows set the activity level", () => {
      render(<TdeeCalculatorPage />);

      const sedentaryRow = screen.getByRole("button", { name: /sedentary/i });
      expect(sedentaryRow).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(sedentaryRow);

      expect(
        screen.getByRole("button", { name: /sedentary/i }),
      ).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Macro Calculator Page", () => {
    it("renders Macro Calculator page with non-NaN totals and interactive split sliders", () => {
      render(<MacroCalculatorPage />);

      expect(
        screen.getByRole("heading", { name: /macro calculator/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/daily target summary/i)).toBeInTheDocument();
      expect(screen.getByText(/macro distribution split/i)).toBeInTheDocument();

      // Ensure protein/carbs/fats targets render valid numbers without NaN
      expect(screen.queryByText(/\bNaN\b/)).not.toBeInTheDocument();
    });
  });

  describe("Weight Loss Calculator Page", () => {
    it("renders Weight Loss & Timeline Calculator with target calorie deficit and timeline", () => {
      render(<WeightLossCalculatorPage />);

      expect(
        screen.getByRole("heading", {
          name: /weight loss & timeline calculator/i,
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(/target daily calories/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated goal date/i)).toBeInTheDocument();
      expect(screen.queryByText(/\bNaN\b/)).not.toBeInTheDocument();
    });

    it("reports a zero adjustment once the target matches current weight", () => {
      render(<WeightLossCalculatorPage />);

      fireEvent.change(screen.getByLabelText(/target weight/i), {
        target: { value: "85" },
      });

      expect(
        screen.getByText(/you're at your goal weight/i),
      ).toBeInTheDocument();
      const deficitRow = screen.getByText(/daily calorie deficit/i).parentElement;
      expect(within(deficitRow as HTMLElement).getByText(/^0 kcal$/)).toBeInTheDocument();
    });
  });

  describe("Protein Calculator Page", () => {
    it("renders Protein Intake Calculator with per-meal targets and food reference table", () => {
      render(<ProteinCalculatorPage />);

      expect(
        screen.getByRole("heading", { name: /protein intake calculator/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/recommended daily protein/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/high-protein food ideas/i)).toBeInTheDocument();
      expect(
        screen.getByText(/chicken breast \(cooked\)/i),
      ).toBeInTheDocument();
    });
  });

  describe("Tools Hub Page", () => {
    it("renders hub page listing all 5 calculators", () => {
      render(<ToolsHubPage />);

      expect(
        screen.getByRole("heading", {
          name: /free nutrition & macro calculators/i,
        }),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/tdee calculator/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/bmr calculator/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/macro calculator/i).length).toBeGreaterThan(
        0,
      );
      expect(screen.getAllByText(/weight loss/i).length).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/protein intake calculator/i).length,
      ).toBeGreaterThan(0);
    });
  });

  describe("Cross navigation", () => {
    it("offers every other calculator, but not the current one", () => {
      render(<BmrCalculatorPage />);

      const related = screen
        .getByRole("heading", { name: /other free calculators/i })
        .closest("section");
      const links = within(related as HTMLElement).getAllByRole("link");
      const hrefs = links.map((link) => link.getAttribute("href"));

      expect(hrefs).toContain("/tools");
      expect(hrefs).toContain("/tools/tdee-calculator");
      expect(hrefs).not.toContain("/tools/bmr-calculator");
    });

    it("links back to the hub from the breadcrumb", () => {
      render(<MacroCalculatorPage />);

      const breadcrumb = screen.getByRole("navigation", { name: /breadcrumb/i });
      expect(
        within(breadcrumb).getByRole("link", { name: /free calculators/i }),
      ).toHaveAttribute("href", "/tools");
    });
  });
});

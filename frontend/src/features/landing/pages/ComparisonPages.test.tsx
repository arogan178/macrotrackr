import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  COMPARISONS,
  getComparisonBySlug,
} from "../comparisons/comparisonsCatalog";

import ComparisonArticlePage from "./ComparisonArticlePage";
import ComparisonIndexPage from "./ComparisonIndexPage";

let mockParameters: { slug?: string } = { slug: "myfitnesspal" };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...properties }: any) => (
    <a href={to} {...properties}>
      {children}
    </a>
  ),
  useParams: () => mockParameters,
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useLocation: () => ({ pathname: "/compare/myfitnesspal" }),
}));

describe("comparisonsCatalog", () => {
  it("defines all major competitors with required fields", () => {
    expect(COMPARISONS.length).toBeGreaterThanOrEqual(4);
    const slugs = COMPARISONS.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);

    for (const comp of COMPARISONS) {
      expect(comp.title).toBeTruthy();
      expect(comp.metaDescription).toBeTruthy();
      expect(comp.matrix.length).toBeGreaterThan(0);
      expect(comp.faqs.length).toBeGreaterThan(0);
    }
  });

  it("retrieves comparisons by slug", () => {
    const mfp = getComparisonBySlug("myfitnesspal");
    expect(mfp).toBeDefined();
    expect(mfp?.competitorName).toBe("MyFitnessPal");

    const missing = getComparisonBySlug("non-existent-competitor");
    expect(missing).toBeNull();
  });
});

describe("ComparisonIndexPage", () => {
  it("renders all competitor comparison cards and master matrix", () => {
    render(<ComparisonIndexPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /compare macrotrackr/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/myfitnesspal/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/macrofactor/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cronometer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/lose it!/i).length).toBeGreaterThan(0);
  });
});

describe("ComparisonArticlePage", () => {
  it("renders the comparison details and feature table for a valid competitor", () => {
    mockParameters = { slug: "myfitnesspal" };
    render(<ComparisonArticlePage />);

    expect(
      screen.getAllByRole("heading", { level: 1 }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/feature comparison/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^questions$/i }),
    ).toBeInTheDocument();
  });

  it("renders not found state when given an invalid slug", () => {
    mockParameters = { slug: "unknown-competitor" };
    render(<ComparisonArticlePage />);

    expect(screen.getByText(/comparison not found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /all comparisons/i })
    ).toBeInTheDocument();
  });
});

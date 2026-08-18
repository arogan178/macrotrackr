import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  COMPARISONS,
  getComparisonBySlug,
} from "../comparisons/comparisonsCatalog";

import ComparisonArticlePage from "./ComparisonArticlePage";
import ComparisonIndexPage from "./ComparisonIndexPage";

let mockParameters: { slug?: string } = { slug: "myfitnesspal-alternative" };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...properties }: any) => (
    <a href={to} {...properties}>
      {children}
    </a>
  ),
  useParams: () => mockParameters,
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useLocation: () => ({ pathname: "/compare/myfitnesspal-alternative" }),
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
    const mfp = getComparisonBySlug("myfitnesspal-alternative");
    expect(mfp).toBeDefined();
    expect(mfp?.competitorName).toBe("MyFitnessPal");

    const missing = getComparisonBySlug("non-existent-competitor");
    expect(missing).toBeNull();
  });
});

describe("ComparisonIndexPage", () => {
  it("renders all competitor comparison cards", () => {
    render(<ComparisonIndexPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /compare macrotrackr/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/myfitnesspal/i)).toBeInTheDocument();
    expect(screen.getByText(/macrofactor/i)).toBeInTheDocument();
    expect(screen.getByText(/cronometer/i)).toBeInTheDocument();
    expect(screen.getByText(/lose it!/i)).toBeInTheDocument();
  });
});

describe("ComparisonArticlePage", () => {
  it("renders the comparison details and feature table for a valid competitor", () => {
    mockParameters = { slug: "myfitnesspal-alternative" };
    render(<ComparisonArticlePage />);

    expect(
      screen.getAllByRole("heading", { level: 1 }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/feature comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
  });

  it("renders not found state when given an invalid slug", () => {
    mockParameters = { slug: "unknown-competitor" };
    render(<ComparisonArticlePage />);

    expect(screen.getByText(/comparison not found/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to all comparisons/i })
    ).toBeInTheDocument();
  });
});

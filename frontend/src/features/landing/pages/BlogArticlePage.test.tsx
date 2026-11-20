import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BlogArticlePage from "./BlogArticlePage";

let mockParameters: { slug?: string } = { slug: "v3-0-0" };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...properties }: any) => (
    <a href={to} {...properties}>
      {children}
    </a>
  ),
  useParams: () => mockParameters,
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useLocation: () => ({ pathname: "/blog/v3-0-0" }),
}));

describe("BlogArticlePage", () => {
  it("renders the article for a valid slug", () => {
    mockParameters = { slug: "v3-0-0" };
    render(<BlogArticlePage />);

    expect(
      screen.getAllByRole("heading", { level: 1 }).length,
    ).toBeGreaterThan(0);
    expect(
      within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "Blog" }),
    ).toBeInTheDocument();
  });

  it("retains the article during exit transition when route params detach", () => {
    mockParameters = { slug: "v3-0-0" };
    const { rerender } = render(<BlogArticlePage />);

    expect(
      screen.getAllByRole("heading", { level: 1 }).length,
    ).toBeGreaterThan(0);

    // Simulates router match changing to /blog while AnimatePresence keeps exiting page mounted
    mockParameters = {};
    rerender(<BlogArticlePage />);

    // Must not crash and must not flash not found
    expect(
      screen.getAllByRole("heading", { level: 1 }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/article not found/i)).not.toBeInTheDocument();
  });

  it("renders a table of contents for multi-section guides without a stock hero banner", () => {
    mockParameters = { slug: "understanding-protein-intake" };
    render(<BlogArticlePage />);

    expect(
      screen.getByRole("complementary", { name: "On this page" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: /understanding protein intake/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders not found state when given an invalid slug", () => {
    mockParameters = { slug: "non-existent-article-slug" };
    render(<BlogArticlePage />);

    expect(screen.getByText(/article not found/i)).toBeInTheDocument();
  });
});

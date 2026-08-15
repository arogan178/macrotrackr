import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BlogArticlePage from "./BlogArticlePage";

let mockParams: { slug?: string } = { slug: "v3-0-0" };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useParams: () => mockParams,
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  useLocation: () => ({ pathname: "/blog/v3-0-0" }),
}));

describe("BlogArticlePage", () => {
  it("renders the article for a valid slug", () => {
    mockParams = { slug: "v3-0-0" };
    render(<BlogArticlePage />);

    expect(
      screen.getAllByRole("heading", { level: 1 }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/back to the blog/i)).toBeInTheDocument();
  });

  it("retains the article during exit transition when route params detach", () => {
    mockParams = { slug: "v3-0-0" };
    const { rerender } = render(<BlogArticlePage />);

    expect(
      screen.getAllByRole("heading", { level: 1 }).length,
    ).toBeGreaterThan(0);

    // Simulates router match changing to /blog while AnimatePresence keeps exiting page mounted
    mockParams = {};
    rerender(<BlogArticlePage />);

    // Must not crash and must not flash not found
    expect(
      screen.getAllByRole("heading", { level: 1 }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/article not found/i)).not.toBeInTheDocument();
  });

  it("renders not found state when given an invalid slug", () => {
    mockParams = { slug: "non-existent-article-slug" };
    render(<BlogArticlePage />);

    expect(screen.getByText(/article not found/i)).toBeInTheDocument();
  });
});

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MIGRATION_GUIDES } from "../migrations/migrationGuidesCatalog";

import MigrationGuidePage from "./MigrationGuidePage";
import MigrationIndexPage from "./MigrationIndexPage";

let mockParameters: { slug?: string } = { slug: "myfitnesspal" };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useLocation: () => ({ pathname: "/migrate/myfitnesspal" }),
  useNavigate: () => vi.fn(),
  useParams: () => mockParameters,
}));

describe("migration guide catalog", () => {
  it("defines a unique guide for every supported external importer", () => {
    expect(MIGRATION_GUIDES).toHaveLength(4);
    expect(new Set(MIGRATION_GUIDES.map(({ slug }) => slug)).size).toBe(4);

    for (const guide of MIGRATION_GUIDES) {
      expect(guide.exportSteps.length).toBeGreaterThanOrEqual(3);
      expect(guide.officialExportUrl).toMatch(/^https:\/\//u);
    }
  });
});

describe("MigrationIndexPage", () => {
  it("links to every supported migration guide", () => {
    render(<MigrationIndexPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /switch trackers without starting over/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/view migration guide/i)).toHaveLength(4);
  });
});

describe("MigrationGuidePage", () => {
  it("shows source-specific export steps and an importer-directed CTA", () => {
    mockParameters = { slug: "myfitnesspal" };
    render(<MigrationGuidePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /import myfitnesspal history/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/limits file export to premium/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /create account and open importer/i }),
    ).toBeVisible();
  });

  it("shows a useful not-found state", () => {
    mockParameters = { slug: "unknown" };
    render(<MigrationGuidePage />);

    expect(screen.getByText(/migration guide not found/i)).toBeVisible();
  });
});

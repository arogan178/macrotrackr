import migrationsData from "@/data/migrations.json";

export interface MigrationGuide {
  slug: "cronometer" | "lose-it" | "macrofactor" | "myfitnesspal";
  sourceName: string;
  title: string;
  description: string;
  summary: string;
  exportSteps: readonly string[];
  fileGuidance: string;
  caveat: string;
  officialExportUrl: string;
}

/**
 * Content lives in `src/data/migrations.json` so `scripts/prerender.mjs` can
 * emit the same steps to crawlers that cannot run JavaScript.
 */
// JSON import widens the slug union to string, so the shape is asserted here.
export const MIGRATION_GUIDES: readonly MigrationGuide[] =
  migrationsData as readonly MigrationGuide[];

export function getMigrationGuide(slug: string): MigrationGuide | null {
  return MIGRATION_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

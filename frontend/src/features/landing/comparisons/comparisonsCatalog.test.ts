import { describe, expect, it } from "vitest";

import {
  COMPARISONS,
  COMPARISONS_HUB_PATH,
  getComparisonBySlug,
} from "./comparisonsCatalog";

describe("comparisonsCatalog", () => {
  it("exports comparison list with required SEO metadata and content", () => {
    expect(COMPARISONS.length).toBeGreaterThan(0);

    for (const comp of COMPARISONS) {
      expect(comp.slug).toBeTruthy();
      expect(comp.competitorName).toBeTruthy();
      expect(comp.title).toBeTruthy();
      expect(comp.metaDescription).toBeTruthy();
      expect(comp.keyDifferentiators.length).toBeGreaterThanOrEqual(2);
      expect(comp.matrix.length).toBeGreaterThanOrEqual(3);
      expect(comp.faqs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("finds a comparison by slug", () => {
    const mfp = getComparisonBySlug("myfitnesspal");
    expect(mfp).toBeDefined();
    expect(mfp?.competitorName).toBe("MyFitnessPal");

    const nonExistent = getComparisonBySlug("non-existent-competitor");
    expect(nonExistent).toBeNull();
  });

  it("provides valid hub path", () => {
    expect(COMPARISONS_HUB_PATH).toBe("/compare");
  });
});

import { describe, expect, it } from "vitest";

import { FEATURES } from "./landingPageConstants";

/**
 * Capabilities the app does not have. The landing page previously advertised a
 * barcode scanner; these must never reappear in marketing copy.
 */
const UNSUPPORTED_CLAIMS = [
  /barcode/i,
  /scan(ner|ning)?\b/i,
  /photo|camera|image recognition/i,
  /AI|machine learning/,
  /coach|dietitian|nutritionist/i,
  /offline/i,
];

describe("landing page features", () => {
  it("claims nothing the app cannot do", () => {
    const copy = FEATURES.map((f) => `${f.name} ${f.description}`).join(" ");

    for (const claim of UNSUPPORTED_CLAIMS) {
      expect(copy).not.toMatch(claim);
    }
  });

  it("keeps every feature described and named exactly once", () => {
    expect(FEATURES.length).toBeGreaterThan(0);
    expect(new Set(FEATURES.map((f) => f.name)).size).toBe(FEATURES.length);

    for (const feature of FEATURES) {
      expect(feature.name.trim()).not.toBe("");
      expect(feature.description.trim()).not.toBe("");
      expect(feature.icon).toBeTruthy();
    }
  });

  it("describes features plainly, without superlatives", () => {
    const copy = FEATURES.map((f) => f.description).join(" ");

    expect(copy).not.toMatch(/!/);
    expect(copy).not.toMatch(
      /seamless|effortless|powerful|unlock|journey|instantly|comprehensive/i,
    );
  });
});

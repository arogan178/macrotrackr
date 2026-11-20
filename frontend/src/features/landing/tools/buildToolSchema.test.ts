import { describe, expect, it } from "vitest";

import { APP_URL } from "@/utils/appConstants";

import { buildToolSchema } from "./buildToolSchema";

describe("buildToolSchema", () => {
  it("generates WebApplication and BreadcrumbList JSON-LD without FAQs", () => {
    const json = buildToolSchema({
      name: "TDEE Calculator",
      description: "Calculate TDEE",
      url: "https://macrotrackr.com/tools/tdee-calculator",
    });

    const [webApp, breadcrumb] = JSON.parse(json);
    expect(webApp["@type"]).toBe("WebApplication");
    expect(webApp.name).toContain("TDEE Calculator");
    expect(webApp.offers.price).toBe("0");
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement.map((item: { item: string }) => item.item)).toEqual([
      APP_URL,
      `${APP_URL}/tools`,
      "https://macrotrackr.com/tools/tdee-calculator",
    ]);
  });

  it("adds FAQPage after the breadcrumb when there are FAQs", () => {
    const json = buildToolSchema({
      name: "BMR Calculator",
      description: "Calculate BMR",
      url: "https://macrotrackr.com/tools/bmr-calculator",
      faqs: [{ question: "What is BMR?", answer: "Basal Metabolic Rate" }],
    });

    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]["@type"]).toBe("WebApplication");
    expect(parsed[1]["@type"]).toBe("BreadcrumbList");
    expect(parsed[2]["@type"]).toBe("FAQPage");
    expect(parsed[2].mainEntity[0].name).toBe("What is BMR?");
  });
});

import { describe, expect, it } from "vitest";

import { buildToolSchema } from "./buildToolSchema";

describe("buildToolSchema", () => {
  it("generates WebApplication JSON-LD schema without FAQs", () => {
    const json = buildToolSchema({
      name: "TDEE Calculator",
      description: "Calculate TDEE",
      url: "https://macrotrackr.com/tools/tdee-calculator",
    });

    const parsed = JSON.parse(json);
    expect(parsed["@type"]).toBe("WebApplication");
    expect(parsed.name).toContain("TDEE Calculator");
    expect(parsed.offers.price).toBe("0");
  });

  it("generates combined WebApplication and FAQPage JSON-LD schema with FAQs", () => {
    const json = buildToolSchema({
      name: "BMR Calculator",
      description: "Calculate BMR",
      url: "https://macrotrackr.com/tools/bmr-calculator",
      faqs: [{ question: "What is BMR?", answer: "Basal Metabolic Rate" }],
    });

    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]["@type"]).toBe("WebApplication");
    expect(parsed[1]["@type"]).toBe("FAQPage");
    expect(parsed[1].mainEntity[0].name).toBe("What is BMR?");
  });

  it("puts the visible breadcrumb between the app and the FAQ", () => {
    const json = buildToolSchema({
      name: "BMR Calculator",
      description: "Calculate BMR",
      url: "https://macrotrackr.com/tools/bmr-calculator",
      faqs: [{ question: "What is BMR?", answer: "Basal Metabolic Rate" }],
      parent: { name: "Free calculators", url: "https://macrotrackr.com/tools" },
    });

    const [webApp, breadcrumb, faq] = JSON.parse(json);
    expect(webApp["@type"]).toBe("WebApplication");
    expect(faq["@type"]).toBe("FAQPage");
    expect(
      breadcrumb.itemListElement.map((item: { name: string; item: string }) => [
        item.name,
        item.item,
      ]),
    ).toEqual([
      ["Free calculators", "https://macrotrackr.com/tools"],
      ["BMR Calculator", "https://macrotrackr.com/tools/bmr-calculator"],
    ]);
  });
});

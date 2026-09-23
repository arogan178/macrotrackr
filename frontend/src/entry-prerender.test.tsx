// @vitest-environment node
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it, vi } from "vitest";

import blogPosts from "@/data/blog-posts.json";
import pageMetadata from "@/data/page-metadata.json";

const metadata: Record<string, { h1?: string }> = pageMetadata;

let render: (pathname: string) => Promise<string>;

// Parsed the way a crawler would, rather than picked apart with regexes.
function parse(html: string): Document {
  return new JSDOM(html).window.document;
}

beforeAll(async () => {
  // Local auth sends every public page to /login; the prerender renders the
  // managed build's signed-out page.
  vi.stubEnv("VITE_AUTH_MODE", "clerk");
  ({ render } = await import("./entry-prerender"));
}, 60_000);

describe("build-time render", () => {
  const firstArticle = blogPosts.find((post) => !/^v\d/.test(post.slug))!;
  const routes = [...Object.keys(metadata), `/blog/${firstArticle.slug}`];

  it.each(routes)("renders %s as a complete page", async (route) => {
    const page = parse(await render(route));
    const h1 = page.querySelector("h1");

    expect(h1).not.toBeNull();
    if (metadata[route]?.h1) expect(h1!.textContent).toBe(metadata[route].h1);

    // The CSP allows no inline script, so anything but JSON-LD would stay
    // inert in the DOM and break hydration.
    expect(
      page.querySelectorAll('script:not([type="application/ld+json"])'),
    ).toHaveLength(0);

    // Entrance animations would paint the page invisible until JS runs.
    const hidden = [...page.querySelectorAll<HTMLElement>("[style]")].filter(
      (element) => element.style.opacity === "0",
    );
    expect(hidden).toHaveLength(0);

    // Crawlers read this raw, so it must parse, and one block per type.
    const types = [
      ...page.querySelectorAll('script[type="application/ld+json"]'),
    ].flatMap((script) =>
      [JSON.parse(script.textContent ?? "")]
        .flat()
        .map((block: { "@type": string }) => block["@type"]),
    );
    expect(new Set(types).size).toBe(types.length);
  });

  it("renders the blog article body, not just its excerpt", async () => {
    const page = parse(await render(`/blog/${firstArticle.slug}`));

    expect(page.body.textContent).toContain(firstArticle.title);
    expect(page.querySelectorAll("p").length).toBeGreaterThan(10);
  });

  it("gives crawlers the calculator method and questions", async () => {
    const text = parse(await render("/tools/tdee-calculator")).body.textContent;

    expect(text).toContain("Mifflin-St Jeor");
    expect(text).toContain("not medical advice");
  });

  it("gives crawlers the comparison table", async () => {
    const text = parse(await render("/compare/myfitnesspal")).body.textContent;

    expect(text).toContain("Barcode Scanner");
    expect(text).toContain("MyFitnessPal");
  });
});

// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from "vitest";

import blogPosts from "@/data/blog-posts.json";
import pageMetadata from "@/data/page-metadata.json";

const metadata: Record<string, { h1?: string }> = pageMetadata;

let render: (pathname: string) => Promise<string>;

function textOf(html: string): string {
  return html
    .replaceAll(/<!--.*?-->/g, "")
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .trim();
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
    const html = await render(route);
    const h1 = /<h1[^>]*>([\S\s]*?)<\/h1>/.exec(html)?.[1];

    expect(h1).toBeDefined();
    if (metadata[route]?.h1) expect(textOf(h1!)).toBe(metadata[route].h1);

    // The CSP allows no inline script, so anything but JSON-LD would stay
    // inert in the DOM and break hydration.
    expect(
      html.match(/<script(?![^>]*application\/ld\+json)[^>]*>/g),
    ).toBeNull();

    // Entrance animations would paint the page invisible until JS runs.
    expect(html).not.toMatch(/opacity:\s*0[";]/);

    // Crawlers read this raw, so it must parse, and one block per type.
    const types = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\S\s]*?)<\/script>/g,
      ),
    ].flatMap(([, json]) =>
      [JSON.parse(json)].flat().map((block) => block["@type"]),
    );
    expect(new Set(types).size).toBe(types.length);
  });

  it("renders the blog article body, not just its excerpt", async () => {
    const html = await render(`/blog/${firstArticle.slug}`);

    expect(textOf(html)).toContain(firstArticle.title);
    expect(html.match(/<p[\s>]/g)?.length ?? 0).toBeGreaterThan(10);
  });

  it("gives crawlers the calculator method and questions", async () => {
    const text = textOf(await render("/tools/tdee-calculator"));

    expect(text).toContain("Mifflin-St Jeor");
    expect(text).toContain("not medical advice");
  });

  it("gives crawlers the comparison table", async () => {
    const text = textOf(await render("/compare/myfitnesspal"));

    expect(text).toContain("Barcode Scanner");
    expect(text).toContain("MyFitnessPal");
  });
});

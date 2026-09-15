import pageMetadata from "@/data/page-metadata.json";

/**
 * Title and description for every pre-rendered public route, read by both the
 * React pages and `scripts/prerender.mjs`.
 *
 * These used to live in two places. The prerenderer wrote one title into the
 * static HTML and `usePageMetadata` replaced it at runtime with another, and
 * since Google indexes the rendered DOM the weaker of the two always won.
 * `pageMetadata.test.ts` asserts the two stay in step.
 */
export interface PageMeta {
  title: string;
  description: string;
  /** Present where the rendered H1 differs from the title. */
  h1?: string;
}

const metadata: Record<string, PageMeta> = pageMetadata;

export function getPageMetadata(path: string): PageMeta {
  const meta = metadata[path];
  if (!meta) {
    throw new Error(
      `No metadata for "${path}". Add it to src/data/page-metadata.json.`,
    );
  }

  return meta;
}

/** Blog articles title from their own frontmatter, so they carry only a suffix. */
export const BLOG_TITLE_SUFFIX = " — MacroTrackr";

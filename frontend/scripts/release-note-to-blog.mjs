#!/usr/bin/env node
/**
 * Turn a release note into a blog post.
 *
 * `release-notes.json` is already the structured record of what shipped. Until
 * now the matching blog post was written by hand, which meant the same release
 * existed twice, in two voices, and could disagree with itself. This derives
 * the post from the note, so a release is one edit in one file.
 *
 *   bun run release:blog            # newest release note
 *   bun run release:blog 3.0.0      # a specific version
 *   bun run release:blog --check    # fail if a note has no post (for CI)
 *
 * Idempotent: an existing post for a version is left alone unless --force.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOTES = path.join(ROOT, "src/data/release-notes.json");
const POSTS = path.join(ROOT, "src/data/blog-posts.json");
const CONTENT_DIR = path.join(ROOT, "src/data/blog-content");

const RELEASE_CATEGORY = "Releases";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const write = (file, value) =>
  writeFileSync(file, `${JSON.stringify(value, undefined, 2)}\n`);

/** `3.0.0` -> `v3-0-0`. */
export const slugFor = (version) => `v${version.replaceAll(".", "-")}`;

/**
 * Releases before this script were posted by hand under descriptive slugs like
 * `v2-5-mobile-ux-polish-and-responsive-density`, and several were never
 * posted at all. Matching on the major.minor prefix lets those count without
 * generating a duplicate beside them, and still catches a new release that
 * ships with no post.
 */
export const hasPostFor = (version, posts) => {
  const prefix = `v${version.split(".").slice(0, 2).join("-")}`;

  return posts.some(
    (post) => post.slug === slugFor(version) || post.slug.startsWith(`${prefix}-`),
  );
};

/** Roughly 200 words a minute, floored at one. */
export const readingTimeFor = (markdown) =>
  `${Math.max(1, Math.round(markdown.split(/\s+/).length / 200))} min`;

export function markdownFor(note) {
  const heading = `# MacroTrackr ${note.version}: ${note.title}`;
  const intro =
    note.summary ??
    `Version ${note.version} is out. Here is what changed and why.`;
  const bullets = note.highlights.map((line) => `- ${line}`).join("\n");

  return `${heading}\n\n${intro}\n\n## What changed\n\n${bullets}\n\nAs always, everything here is in the open-source repository, and your data stays exportable.\n\nThe MacroTrackr Team\n`;
}

export function postFor(note, markdown) {
  return {
    slug: slugFor(note.version),
    title: `MacroTrackr ${note.version}: ${note.title}`,
    excerpt: note.summary ?? note.highlights[0],
    date: note.date,
    category: RELEASE_CATEGORY,
    author: "MacroTrackr Team",
    readingTime: readingTimeFor(markdown),
    tags: ["Product", "Release Notes"],
    featured: false,
  };
}

function main(argv) {
  const force = argv.includes("--force");
  const check = argv.includes("--check");
  const version = argv.find((argument) => !argument.startsWith("--"));

  const notes = read(NOTES);
  const posts = read(POSTS);
  const targets = version
    ? notes.filter((note) => note.version === version)
    : [notes[0]];

  if (targets.length === 0) {
    console.error(`No release note for version ${version}`);
    process.exit(1);
  }

  if (check) {
    const missing = notes
      .filter((note) => !hasPostFor(note.version, posts))
      .map((note) => note.version);

    if (missing.length > 0) {
      console.error(
        `Release notes with no blog post: ${missing.join(", ")}\n` +
          `Run: bun run release:blog <version>`,
      );
      process.exit(1);
    }
    console.log(`All ${notes.length} release notes have a post.`);

    return;
  }

  for (const note of targets) {
    const slug = slugFor(note.version);
    const contentPath = path.join(CONTENT_DIR, `${slug}.md`);
    const exists = posts.some((post) => post.slug === slug);

    if (exists && !force) {
      console.log(`${slug} already has a post. Use --force to rewrite.`);
      continue;
    }

    const markdown = markdownFor(note);
    writeFileSync(contentPath, markdown);

    const entry = postFor(note, markdown);
    const next = exists
      ? posts.map((post) => (post.slug === slug ? entry : post))
      : [entry, ...posts];

    write(POSTS, next);
    console.log(`${exists ? "Rewrote" : "Created"} ${slug}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}

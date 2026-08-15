import { describe, expect, it } from "vitest";

import {
  hasPostFor,
  markdownFor,
  postFor,
  readingTimeFor,
  slugFor,
} from "../../scripts/release-note-to-blog.mjs";
import posts from "../data/blog-posts.json";
import notes from "../data/release-notes.json";

const note = {
  version: "9.9.9",
  date: "2030-01-01",
  title: "A Title",
  summary: "A summary.",
  highlights: ["First thing", "Second thing"],
};

describe("release note to blog", () => {
  it("slugs a version the way the archive already does", () => {
    expect(slugFor("3.0.0")).toBe("v3-0-0");
  });

  it("carries every highlight into the post body", () => {
    const markdown = markdownFor(note);

    for (const highlight of note.highlights) {
      expect(markdown).toContain(highlight);
    }
  });

  it("files the post under Releases, so it stays out of the article feed", () => {
    expect(postFor(note, markdownFor(note)).category).toBe("Releases");
  });

  it("never reports a reading time of zero minutes", () => {
    expect(readingTimeFor("one word")).toBe("1 min");
  });

  it("counts a hand-written post from before this script existed", () => {
    // v2.5 was posted under a descriptive slug; regenerating it would put a
    // duplicate beside it.
    expect(hasPostFor("2.5.0", posts)).toBe(true);
  });

  it("still catches a release that shipped with no post at all", () => {
    // Against a fixture, not the live archive: this asserted on a real gap and
    // broke the moment that gap was filled.
    expect(hasPostFor("4.1.0", [{ slug: "v3-0-0" }])).toBe(false);
  });

  it("recognises the post it just generated for this release", () => {
    expect(hasPostFor("3.0.0", posts)).toBe(true);
  });
});

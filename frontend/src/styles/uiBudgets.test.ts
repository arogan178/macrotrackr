import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts", "check-ui-budgets.mjs");
const BUDGETS = path.join(ROOT, "ui-budgets.json");

const rev = (revision: string): string =>
  execFileSync("git", ["rev-parse", revision], { encoding: "utf8" }).trim();

// The base is always passed explicitly. Left to itself the check resolves the
// fork point against origin/master, so whether a breach is absolved would
// depend on which refs the machine happens to have — green in a shallow CI
// clone, red on a developer's.
const run = (base: string): { status: number; output: string } => {
  try {
    const output = execFileSync("node", [SCRIPT], {
      encoding: "utf8",
      env: { ...process.env, UI_BUDGET_BASE_SHA: base },
    });

    return { status: 0, output };
  } catch (error) {
    const failure = error as { status: number; stdout: string; stderr: string };

    return { status: failure.status, output: failure.stdout + failure.stderr };
  }
};

const original = readFileSync(BUDGETS, "utf8");

afterEach(() => {
  writeFileSync(BUDGETS, original);
});

describe("ui budgets", () => {
  it("passes on the current tree", () => {
    const { status, output } = run(rev("HEAD"));

    expect(output).toContain("UI budgets");
    expect(status).toBe(0);
  });

  // A base of HEAD is a tree compared against itself, which the check treats as
  // no base at all, so this is the budget standing on its own.
  it("fails when a budget is exceeded and no base absolves it", () => {
    const budgets = JSON.parse(original);
    budgets.budgets.radii = 0;
    writeFileSync(BUDGETS, JSON.stringify(budgets, undefined, 2));

    const { status, output } = run(rev("HEAD"));

    expect(status).toBe(1);
    expect(output).toContain("radii");
    expect(output).toContain("ui-budgets.json");
  });

  it("absolves a count the base already holds, and says whose it is", () => {
    const budgets = JSON.parse(original);
    budgets.budgets.radii = 0;
    writeFileSync(BUDGETS, JSON.stringify(budgets, undefined, 2));

    const { status, output } = run(rev("HEAD^"));

    expect(status).toBe(0);
    expect(output).toContain("~~ radii");
    expect(output).toContain("this change did not move it");
  });

  it("holds the closed token set at its intended shape", () => {
    const budgets = JSON.parse(original).budgets;

    // Four surfaces, two hairlines, three radii, no alpha elevation, and no
    // shadows — nothing is darker than #000.
    expect(budgets.radii).toBe(3);
    expect(budgets.surfaces).toBe(4);
    expect(budgets.surfaceAlpha).toBe(0);
    expect(budgets.hairlineAlpha).toBe(0);
    expect(budgets.legacyRadii).toBe(0);
    expect(budgets.shadows).toBe(0);
  });
});

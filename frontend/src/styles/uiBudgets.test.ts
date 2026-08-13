import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SCRIPT = path.join(ROOT, "scripts", "check-ui-budgets.mjs");
const BUDGETS = path.join(ROOT, "ui-budgets.json");

const run = (): { status: number; output: string } => {
  try {
    const output = execFileSync("node", [SCRIPT], { encoding: "utf8" });

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
    const { status, output } = run();

    expect(output).toContain("UI budgets");
    expect(status).toBe(0);
  });

  it("fails when a budget is exceeded, so drift is caught in review", () => {
    const budgets = JSON.parse(original);
    budgets.budgets.radii = 0;
    writeFileSync(BUDGETS, JSON.stringify(budgets, undefined, 2));

    const { status, output } = run();

    expect(status).toBe(1);
    expect(output).toContain("radii");
    expect(output).toContain("ui-budgets.json");
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

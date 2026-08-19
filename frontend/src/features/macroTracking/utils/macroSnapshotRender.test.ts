import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveTokens } from "@/lib/designTokens";

import type { MacroSnapshotData } from "./macroSnapshot";
import {
  renderSnapshotToCanvas,
  SNAPSHOT_HEIGHT,
  SNAPSHOT_WIDTH,
} from "./macroSnapshotCanvas";

/**
 * What the export actually paints.
 *
 * The parity test asserts neither renderer holds its own values; this asserts
 * the values that reach the canvas are the app's. Between them they cover the
 * reported bug from both sides: no second source, and the right colours out.
 */

const data: MacroSnapshotData = {
  dateLabel: "Aug 19, 2026",
  calories: 1222,
  calorieTarget: 2000,
  protein: 50,
  proteinTarget: 175,
  carbs: 181,
  carbsTarget: 160,
  fats: 33,
  fatsTarget: 73,
};

interface Recorded {
  fills: string[];
  texts: string[];
  maxY: number;
  gradients: number;
}

function record(): { context: CanvasRenderingContext2D; out: Recorded } {
  const out: Recorded = { fills: [], texts: [], maxY: 0, gradients: 0 };
  let fillStyle = "";

  const track = (y: unknown) => {
    if (typeof y === "number" && y > out.maxY) out.maxY = y;
  };

  const context = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value: string) {
      fillStyle = value;
      out.fills.push(value);
    },
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    fontStretch: "normal",
    textAlign: "left" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
    fillRect: (_x: number, y: number, _w: number, h: number) => track(y + h),
    fillText: (text: string, _x: number, y: number) => {
      out.texts.push(text);
      track(y);
    },
    measureText: () => ({ width: 80 }),
    roundRect: (_x: number, y: number, _w: number, h: number) => track(y + h),
    beginPath: vi.fn(),
    moveTo: (_x: number, y: number) => track(y),
    lineTo: (_x: number, y: number) => track(y),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    arc: (_x: number, y: number) => track(y),
    ellipse: (_x: number, y: number) => track(y),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: () => {
      out.gradients++;

      return { addColorStop: vi.fn() };
    },
    createRadialGradient: () => {
      out.gradients++;

      return { addColorStop: vi.fn() };
    },
  } as unknown as CanvasRenderingContext2D;

  return { context, out };
}

describe("the exported PNG", () => {
  let out: Recorded;

  beforeEach(() => {
    const recorder = record();
    out = recorder.out;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      recorder.context as unknown as RenderingContext,
    );
    renderSnapshotToCanvas(data);
  });

  it("paints only colours the app declares", () => {
    const allowed = new Set(Object.values(resolveTokens()));
    const unexpected = [...new Set(out.fills)].filter(
      (fill) => !allowed.has(fill),
    );

    expect(unexpected).toEqual([]);
  });

  it("paints fats in the app's yellow, not the old rose", () => {
    const tokens = resolveTokens();

    expect(out.fills).toContain(tokens.fats);
    expect(out.fills).not.toContain("#f43f5e");
    expect(out.fills).not.toContain("#fb7185");
  });

  it("prints the true percentage rather than a clamped one", () => {
    // 181g against a 160g target. The preview showed 100%, the PNG 113%; both
    // now show 113%.
    expect(out.texts).toContain("of 160 g · 113%");
  });

  it("uses no gradient", () => {
    expect(out.gradients).toBe(0);
  });

  it("fills the canvas it declares", () => {
    // The old export stopped ~220px short of its declared height, which is the
    // empty band at the bottom of the reported image.
    expect(out.maxY).toBeLessThanOrEqual(SNAPSHOT_HEIGHT);
    expect(out.maxY).toBeGreaterThan(SNAPSHOT_HEIGHT - 60);
  });

  it("carries no brochure lines", () => {
    const copy = out.texts.join(" ");

    expect(copy).not.toMatch(/PRECISION NUTRITION|Verified|Self-Hosted/i);
    expect(copy).not.toMatch(/!/);
  });

  it("draws at the declared width", () => {
    expect(SNAPSHOT_WIDTH).toBe(1080);
  });
});

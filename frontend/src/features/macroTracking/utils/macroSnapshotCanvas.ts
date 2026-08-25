import {
  BRAND_MARK_PATH,
  BRAND_MARK_VIEW_BOX,
} from "@/components/layout/BrandMarkPath";
import { formatGrouped } from "@/lib/formatNumber";

import {
  buildSnapshotModel,
  type MacroSnapshotData,
  resolveSnapshotPalette,
  type SnapshotMacroRow,
  type SnapshotModel,
  type SnapshotPalette,
} from "./macroSnapshot";

export type { MacroSnapshotData } from "./macroSnapshot";

/**
 * The PNG the preview promises.
 *
 * Every number, colour and string comes from `buildSnapshotModel` and
 * `resolveSnapshotPalette`, so this file decides layout and nothing else. It
 * previously decided all three, which is why the export carried a cool slate
 * palette, a rose fats bar, two extra brochure lines and an unclamped
 * percentage the preview clamped.
 *
 * Height is measured, not declared. The old fixed 1350 left ~180px of dead
 * canvas below the content because the blocks were placed at hand-tuned
 * offsets that no longer reached the bottom.
 */

const WIDTH = 1080;
const MARGIN = 48;
const PAD = 40;
const CONTENT_X = MARGIN + PAD;
const CONTENT_W = WIDTH - (MARGIN + PAD) * 2;

const RADIUS_CARD = 28;
const RADIUS_PANEL = 20;
const RADIUS_BAR = 8;

/** Matches `--font-sans`: Archivo, with the stack the app falls back through. */
const FAMILY =
  '"Archivo", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

type FontWeight = 400 | 500 | 600 | 700;

/**
 * Mirrors the type scale. `condensed` is the width axis the display steps use;
 * Canvas takes `font-stretch` in the shorthand only in newer engines, so the
 * value is applied through `fontStretch` where that exists and dropped
 * elsewhere rather than risking a rejected `font` string (which would silently
 * keep the previous font).
 */
function setFont(
  ctx: CanvasRenderingContext2D,
  weight: FontWeight,
  size: number,
  condensed = false,
) {
  const context = ctx as CanvasRenderingContext2D & { fontStretch?: string };
  if (typeof context.fontStretch === "string") {
    context.fontStretch = condensed ? "condensed" : "normal";
  }
  ctx.font = `${weight} ${size}px ${FAMILY}`;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, r);

    return;
  }

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function fillPanel(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = RADIUS_PANEL,
) {
  ctx.fillStyle = palette.surface2;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fill();

  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
}

/** A track and its fill. Flat, because a decorative gradient is not allowed. */
function bar(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  x: number,
  y: number,
  width: number,
  height: number,
  percent: number,
  colour: string,
) {
  ctx.fillStyle = palette.surface3;
  roundedRect(ctx, x, y, width, height, RADIUS_BAR);
  ctx.fill();

  if (percent <= 0) return;
  const fill = Math.max(height, (width * percent) / 100);
  ctx.fillStyle = colour;
  roundedRect(ctx, x, y, fill, height, RADIUS_BAR);
  ctx.fill();
}

function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

/** Eyebrow: micro step — condensed, uppercase, wide tracking, muted. */
function eyebrow(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign = "left",
) {
  setFont(ctx, 600, 20, true);
  ctx.fillStyle = palette.muted;
  ctx.textAlign = align;
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.textAlign = "left";
}

const macroColour = (palette: SnapshotPalette, row: SnapshotMacroRow) =>
  palette[row.key];

/** Block heights, so the canvas can be sized before anything is drawn. */
const HEADER_H = 76;
const TITLE_H = 92;
const HERO_H = 236;
const MACRO_H = 250;
const DIST_H = 152;
const FOOTER_H = 72;
const GAP = 24;

const CARD_H =
  PAD +
  HEADER_H +
  TITLE_H +
  HERO_H +
  GAP +
  MACRO_H +
  GAP +
  DIST_H +
  GAP +
  FOOTER_H +
  PAD;

export const SNAPSHOT_WIDTH = WIDTH;
export const SNAPSHOT_HEIGHT = CARD_H + MARGIN * 2;

export function renderSnapshotToCanvas(
  data: MacroSnapshotData,
): HTMLCanvasElement {
  const model = buildSnapshotModel(data);
  const palette = resolveSnapshotPalette();

  const canvas = document.createElement("canvas");
  canvas.width = SNAPSHOT_WIDTH;
  canvas.height = SNAPSHOT_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create 2D canvas rendering context");
  }

  ctx.textBaseline = "alphabetic";

  // Page
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card
  ctx.fillStyle = palette.surface;
  roundedRect(ctx, MARGIN, MARGIN, WIDTH - MARGIN * 2, CARD_H, RADIUS_CARD);
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, MARGIN, MARGIN, WIDTH - MARGIN * 2, CARD_H, RADIUS_CARD);
  ctx.stroke();

  let y = MARGIN + PAD;

  y = drawHeader(ctx, palette, model, y);
  y = drawTitle(ctx, palette, model, y);
  y = drawHero(ctx, palette, model, y) + GAP;
  y = drawMacros(ctx, palette, model, y) + GAP;
  y = drawDistribution(ctx, palette, model, y) + GAP;
  drawFooter(ctx, palette, y);

  return canvas;
}

/**
 * The pea pod, from the same path the `BrandMark` SVG uses. Drawn rather than
 * approximated: an earlier version of this file replaced the path with an
 * ellipse, which shipped a green blob where the logo should be.
 *
 * `Path2D` is available in every browser that can export a canvas. Without it
 * the square is still the brand colour, which reads as the mark at 44px.
 */
function drawBrandMark(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  x: number,
  y: number,
  size: number,
) {
  if (typeof Path2D === "undefined") return;

  const inset = size * 0.16;
  const scale = (size - inset * 2) / BRAND_MARK_VIEW_BOX.width;
  const drawnHeight = BRAND_MARK_VIEW_BOX.height * scale;

  ctx.save();
  ctx.translate(x + inset, y + (size - drawnHeight) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-BRAND_MARK_VIEW_BOX.x, -BRAND_MARK_VIEW_BOX.y);
  ctx.fillStyle = palette.background;
  ctx.fill(new Path2D(BRAND_MARK_PATH), "evenodd");
  ctx.restore();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  model: SnapshotModel,
  top: number,
): number {
  const markSize = 44;

  // The mark carries the colour, the word is foreground.
  ctx.fillStyle = palette.primary;
  roundedRect(ctx, CONTENT_X, top, markSize, markSize, 12);
  ctx.fill();

  drawBrandMark(ctx, palette, CONTENT_X, top, markSize);

  setFont(ctx, 700, 30, true);
  ctx.fillStyle = palette.foreground;
  ctx.fillText("MacroTrackr", CONTENT_X + markSize + 16, top + 31);

  // Badge, right-aligned on the same baseline.
  setFont(ctx, 600, 20, true);
  const label = model.badge.toUpperCase();
  const badgeW = ctx.measureText(label).width + 36;
  const badgeH = 40;
  const badgeX = CONTENT_X + CONTENT_W - badgeW;

  ctx.fillStyle = palette.surface2;
  roundedRect(ctx, badgeX, top + 2, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.strokeStyle = palette.border2;
  ctx.lineWidth = 2;
  roundedRect(ctx, badgeX, top + 2, badgeW, badgeH, badgeH / 2);
  ctx.stroke();

  ctx.fillStyle = palette.primary;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, badgeX + badgeW / 2, top + 2 + badgeH / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Strong rule: this is a header division.
  const ruleY = top + HEADER_H - 16;
  ctx.strokeStyle = palette.border2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CONTENT_X, ruleY);
  ctx.lineTo(CONTENT_X + CONTENT_W, ruleY);
  ctx.stroke();

  return top + HEADER_H;
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  model: SnapshotModel,
  top: number,
): number {
  eyebrow(ctx, palette, model.title, CONTENT_X, top + 26);

  setFont(ctx, 700, 44, true);
  ctx.fillStyle = palette.foreground;
  ctx.fillText(model.dateLabel, CONTENT_X, top + 76);

  return top + TITLE_H;
}

function drawHero(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  model: SnapshotModel,
  top: number,
): number {
  fillPanel(ctx, palette, CONTENT_X, top, CONTENT_W, HERO_H);

  const innerX = CONTENT_X + 32;
  const innerW = CONTENT_W - 64;

  eyebrow(ctx, palette, "Calories", innerX, top + 44);

  setFont(ctx, 500, 20);
  ctx.fillStyle = palette.muted;
  ctx.textAlign = "right";
  ctx.fillText(
    `Target ${formatGrouped(model.calorieTarget)} kcal`,
    innerX + innerW,
    top + 44,
  );
  ctx.textAlign = "left";

  // Hero figure: condensed and bold, per the Value scale.
  setFont(ctx, 700, 86, true);
  ctx.fillStyle = palette.foreground;
  const figure = formatGrouped(model.calories);
  ctx.fillText(figure, innerX, top + 128);
  const figureW = ctx.measureText(figure).width;

  setFont(ctx, 500, 24);
  ctx.fillStyle = palette.muted;
  ctx.fillText(
    `kcal of ${formatGrouped(model.calorieTarget)}`,
    innerX + figureW + 14,
    top + 128,
  );

  bar(
    ctx,
    palette,
    innerX,
    top + 156,
    innerW,
    16,
    model.calorieBarPercent,
    palette.primary,
  );

  setFont(ctx, 600, 20);
  ctx.fillStyle = palette.foreground;
  ctx.fillText(`${model.caloriePercent}% of target`, innerX, top + 206);

  ctx.fillStyle = palette.muted;
  setFont(ctx, 500, 20);
  ctx.textAlign = "right";
  ctx.fillText(model.calorieRemainder, innerX + innerW, top + 206);
  ctx.textAlign = "left";

  return top + HERO_H;
}

function drawMacros(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  model: SnapshotModel,
  top: number,
): number {
  const gap = 20;
  const colW = (CONTENT_W - gap * 2) / 3;

  model.macros.forEach((row, index) => {
    const x = CONTENT_X + index * (colW + gap);
    const colour = macroColour(palette, row);
    fillPanel(ctx, palette, x, top, colW, MACRO_H);

    const innerX = x + 24;
    const innerW = colW - 48;

    dot(ctx, innerX + 6, top + 34, colour);
    setFont(ctx, 600, 20, true);
    ctx.fillStyle = colour;
    ctx.fillText(row.label.toUpperCase(), innerX + 22, top + 41);

    setFont(ctx, 700, 54, true);
    ctx.fillStyle = palette.foreground;
    const grams = `${row.grams}`;
    ctx.fillText(grams, innerX, top + 112);
    const gramsW = ctx.measureText(grams).width;

    setFont(ctx, 500, 22);
    ctx.fillStyle = palette.muted;
    ctx.fillText("g", innerX + gramsW + 8, top + 112);

    setFont(ctx, 500, 20);
    ctx.fillStyle = palette.muted;
    ctx.fillText(
      `of ${row.targetGrams} g · ${row.percentOfTarget}%`,
      innerX,
      top + 148,
    );

    bar(ctx, palette, innerX, top + 170, innerW, 10, row.barPercent, colour);

    setFont(ctx, 600, 20);
    ctx.fillStyle = palette.foreground;
    ctx.fillText(`${formatGrouped(row.calories)} kcal`, innerX, top + 222);

    setFont(ctx, 500, 20);
    ctx.fillStyle = palette.muted;
    ctx.textAlign = "right";
    ctx.fillText(`${row.energyShare}%`, innerX + innerW, top + 222);
    ctx.textAlign = "left";
  });

  return top + MACRO_H;
}

function drawDistribution(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  model: SnapshotModel,
  top: number,
): number {
  fillPanel(ctx, palette, CONTENT_X, top, CONTENT_W, DIST_H);

  const innerX = CONTENT_X + 32;
  const innerW = CONTENT_W - 64;

  eyebrow(ctx, palette, "Energy split", innerX, top + 42);

  setFont(ctx, 500, 20);
  ctx.fillStyle = palette.muted;
  ctx.textAlign = "right";
  ctx.fillText(
    `${formatGrouped(model.totalMacroCalories)} kcal from macros`,
    innerX + innerW,
    top + 42,
  );
  ctx.textAlign = "left";

  const stripY = top + 60;
  const stripH = 16;
  ctx.fillStyle = palette.surface3;
  roundedRect(ctx, innerX, stripY, innerW, stripH, RADIUS_BAR);
  ctx.fill();

  ctx.save();
  roundedRect(ctx, innerX, stripY, innerW, stripH, RADIUS_BAR);
  ctx.clip();
  let offset = innerX;
  model.macros.forEach((row, index) => {
    const isLast = index === model.macros.length - 1;
    const segment = isLast
      ? innerX + innerW - offset
      : (innerW * row.energyShare) / 100;
    ctx.fillStyle = macroColour(palette, row);
    ctx.fillRect(offset, stripY, segment, stripH);
    offset += segment;
  });
  ctx.restore();

  // Legend on an even three-column grid, so it cannot collide at any share.
  const legendY = top + 120;
  const columnW = innerW / 3;
  model.macros.forEach((row, index) => {
    const x = innerX + index * columnW;
    dot(ctx, x + 6, legendY - 7, macroColour(palette, row));
    setFont(ctx, 500, 20);
    ctx.fillStyle = palette.foreground;
    ctx.fillText(`${row.label} ${row.energyShare}%`, x + 22, legendY);
  });

  return top + DIST_H;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  palette: SnapshotPalette,
  top: number,
) {
  const ruleY = top + 8;
  ctx.strokeStyle = palette.border2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CONTENT_X, ruleY);
  ctx.lineTo(CONTENT_X + CONTENT_W, ruleY);
  ctx.stroke();

  setFont(ctx, 500, 20);
  ctx.fillStyle = palette.muted;
  ctx.fillText("Logged with MacroTrackr", CONTENT_X, ruleY + 40);

  ctx.fillStyle = palette.primary;
  setFont(ctx, 600, 20);
  ctx.textAlign = "right";
  ctx.fillText("macrotrackr.com", CONTENT_X + CONTENT_W, ruleY + 40);
  ctx.textAlign = "left";
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob returned null"));
        }
      }, "image/png");

      return;
    }

    if (typeof canvas.toDataURL !== "function") {
      reject(new Error("Canvas export not supported in this environment"));

      return;
    }

    try {
      const base64Data = canvas.toDataURL("image/png").split(",")[1];
      if (!base64Data) {
        reject(new Error("Invalid canvas data URL"));

        return;
      }
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) {
        array[index] = binary.charCodeAt(index);
      }
      resolve(new Blob([array], { type: "image/png" }));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Waits for Archivo before drawing. Canvas silently substitutes a fallback face
 * for a font that has not loaded, which on a cold open produced a PNG in the
 * system UI font while the preview beside it was already in Archivo.
 */
async function withFontsReady(): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.ready) return;
  try {
    await fonts.ready;
  } catch {
    // A rejected font load is not a reason to refuse the export.
  }
}

export async function generateSnapshotBlob(
  data: MacroSnapshotData,
): Promise<Blob> {
  await withFontsReady();

  return canvasToBlob(renderSnapshotToCanvas(data));
}

export async function downloadSnapshotImage(
  data: MacroSnapshotData,
  filename?: string,
): Promise<void> {
  const { fileStem } = buildSnapshotModel(data);
  const blob = await generateSnapshotBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `macrotrackr-${fileStem}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copySnapshotToClipboard(
  data: MacroSnapshotData,
): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    throw new Error("Clipboard image write not supported in this browser");
  }

  const blob = await generateSnapshotBlob(data);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

  return true;
}

export async function shareSnapshot(
  data: MacroSnapshotData,
): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    throw new Error("Web Share API not supported in this browser");
  }

  const model = buildSnapshotModel(data);
  const blob = await generateSnapshotBlob(data);
  const file = new File([blob], `macrotrackr-${model.fileStem}.png`, {
    type: "image/png",
  });

  const payload = {
    title: model.title,
    text: model.shareText,
  };

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ ...payload, files: [file] });

    return true;
  }

  await navigator.share(payload);

  return true;
}

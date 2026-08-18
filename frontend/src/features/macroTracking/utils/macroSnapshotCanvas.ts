export interface MacroSnapshotData {
  title?: string;
  dateLabel?: string;
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fats: number;
  fatsTarget: number;
  streakDays?: number;
  complianceScore?: number;
  badgeLabel?: string;
  userName?: string;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
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

/**
 * Draws the MacroTrackr pea-pod logo mark onto a Canvas
 */
function drawBrandLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);

  // Background circle for badge
  ctx.fillStyle = "#15803d";
  drawRoundedRect(ctx, 0, 0, size, size, size * 0.28);
  ctx.fill();

  // Pea pod inner artwork
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.5, size * 0.38, size * 0.22, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // 3 peas
  ctx.fillStyle = "#09090b";
  const peaRadius = size * 0.07;
  const peas = [
    { x: size * 0.36, y: size * 0.58 },
    { x: size * 0.5, y: size * 0.5 },
    { x: size * 0.64, y: size * 0.42 },
  ];

  for (const pea of peas) {
    ctx.beginPath();
    ctx.arc(pea.x, pea.y, peaRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders the complete Strava/Whoop-style macro scorecard to an HTML5 Canvas element
 */
export function renderSnapshotToCanvas(data: MacroSnapshotData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create 2D canvas rendering context");
  }

  const cal = Math.round(data.calories);
  const targetCal = Math.round(data.calorieTarget) || 2000;
  const calPercent = Math.min(100, Math.round((cal / targetCal) * 100));

  const proteinG = Math.round(data.protein);
  const proteinTargetG = Math.round(data.proteinTarget) || 150;
  const proteinPercent = Math.min(100, Math.round((proteinG / proteinTargetG) * 100));

  const carbsG = Math.round(data.carbs);
  const carbsTargetG = Math.round(data.carbsTarget) || 200;
  const carbsPercent = Math.min(100, Math.round((carbsG / carbsTargetG) * 100));

  const fatsG = Math.round(data.fats);
  const fatsTargetG = Math.round(data.fatsTarget) || 65;
  const fatsPercent = Math.min(100, Math.round((fatsG / fatsTargetG) * 100));

  const proteinCals = proteinG * 4;
  const carbsCals = carbsG * 4;
  const fatsCals = fatsG * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals;

  const pRatio = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 30;
  const cRatio = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 45;
  const fRatio = totalMacroCals > 0 ? Math.max(0, 100 - pRatio - cRatio) : 25;

  // 1. Base Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, "#09090b");
  bgGrad.addColorStop(1, "#121218");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle ambient glows
  const topGlow = ctx.createRadialGradient(250, 200, 10, 250, 200, 450);
  topGlow.addColorStop(0, "rgba(34, 197, 94, 0.12)");
  topGlow.addColorStop(1, "rgba(34, 197, 94, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const bottomGlow = ctx.createRadialGradient(850, 1100, 10, 850, 1100, 500);
  bottomGlow.addColorStop(0, "rgba(59, 130, 246, 0.08)");
  bottomGlow.addColorStop(1, "rgba(59, 130, 246, 0)");
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Outer Card Frame
  const cardX = 54;
  const cardY = 54;
  const cardW = CANVAS_WIDTH - 108;
  const cardH = CANVAS_HEIGHT - 108;

  ctx.fillStyle = "#121218";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fill();

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.stroke();

  // 3. Header Section (Logo, App Name, Date, Badge)
  const headerY = 100;
  drawBrandLogo(ctx, 100, headerY, 52);

  // Brand Name
  ctx.fillStyle = "#fafafa";
  ctx.font = '700 32px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("MacroTrackr", 168, headerY + 26);

  // Badge on the right
  const badgeText =
    data.badgeLabel ??
    (data.streakDays && data.streakDays > 0
      ? `🔥 ${data.streakDays}-Day Streak`
      : data.complianceScore
        ? `🎯 ${data.complianceScore}% Compliance`
        : `${calPercent}% of Goal`);

  ctx.font = '600 20px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 36;
  const badgeX = CANVAS_WIDTH - 100 - badgeWidth;
  const badgeY = headerY + 6;

  ctx.fillStyle = "#1a1a22";
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 40, 20);
  ctx.fill();

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 40, 20);
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 20);

  // Title / Date Header
  const titleY = 200;
  ctx.fillStyle = "#a1a1aa";
  ctx.font = '600 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText((data.title ?? "DAILY SUMMARY").toUpperCase(), 100, titleY);

  ctx.fillStyle = "#fafafa";
  ctx.font = '700 28px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.dateLabel ?? "Today's Nutrition Snapshot", 100, titleY + 36);

  // 4. Hero Energy (Calories) Card
  const heroY = 280;
  const heroH = 240;
  const heroW = 880;
  const heroX = 100;

  ctx.fillStyle = "#1a1a22";
  drawRoundedRect(ctx, heroX, heroY, heroW, heroH, 24);
  ctx.fill();

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, heroX, heroY, heroW, heroH, 24);
  ctx.stroke();

  // Inside Hero Card
  ctx.fillStyle = "#a1a1aa";
  ctx.font = '600 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("CALORIES CONSUMED", heroX + 36, heroY + 44);

  // Big Calorie Number
  ctx.fillStyle = "#fafafa";
  ctx.font = '800 64px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const calString = cal.toLocaleString();
  ctx.fillText(calString, heroX + 36, heroY + 115);

  const calNumWidth = ctx.measureText(calString).width;
  ctx.fillStyle = "#a1a1aa";
  ctx.font = '600 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`kcal  /  ${targetCal.toLocaleString()} goal`, heroX + 48 + calNumWidth, heroY + 115);

  // Progress Bar for Calories
  const barX = heroX + 36;
  const barY = heroY + 160;
  const barW = heroW - 72;
  const barH = 18;

  ctx.fillStyle = "#22222c";
  drawRoundedRect(ctx, barX, barY, barW, barH, 9);
  ctx.fill();

  const calProgressW = Math.max(12, (barW * Math.min(100, calPercent)) / 100);
  const calBarGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  calBarGrad.addColorStop(0, "#22c55e");
  calBarGrad.addColorStop(1, "#4ade80");
  ctx.fillStyle = calBarGrad;
  drawRoundedRect(ctx, barX, barY, calProgressW, barH, 9);
  ctx.fill();

  // Calorie Subtext: % and remaining
  ctx.font = '500 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = "#22c55e";
  ctx.fillText(`${calPercent}% Achieved`, barX, barY + 42);

  const remaining = targetCal - cal;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "right";
  ctx.fillText(
    remaining >= 0 ? `${remaining.toLocaleString()} kcal remaining` : `${Math.abs(remaining).toLocaleString()} kcal over goal`,
    barX + barW,
    barY + 42,
  );

  // 5. Macro Breakdown: 3 Columns
  const macroGridY = 550;
  const macroColW = 274;
  const macroColH = 260;
  const macroGap = 29;

  const macros = [
    {
      name: "PROTEIN",
      color: "#22c55e",
      grams: proteinG,
      target: proteinTargetG,
      percent: proteinPercent,
      cals: proteinCals,
      ratio: pRatio,
    },
    {
      name: "CARBS",
      color: "#3b82f6",
      grams: carbsG,
      target: carbsTargetG,
      percent: carbsPercent,
      cals: carbsCals,
      ratio: cRatio,
    },
    {
      name: "FATS",
      color: "#ef4444",
      grams: fatsG,
      target: fatsTargetG,
      percent: fatsPercent,
      cals: fatsCals,
      ratio: fRatio,
    },
  ];

  ctx.textAlign = "left";

  macros.forEach((m, index) => {
    const colX = 100 + index * (macroColW + macroGap);

    ctx.fillStyle = "#1a1a22";
    drawRoundedRect(ctx, colX, macroGridY, macroColW, macroColH, 20);
    ctx.fill();

    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, colX, macroGridY, macroColW, macroColH, 20);
    ctx.stroke();

    // Top indicator pill
    ctx.fillStyle = m.color;
    drawRoundedRect(ctx, colX + 24, macroGridY + 24, 10, 10, 5);
    ctx.fill();

    // Macro Name
    ctx.fillStyle = m.color;
    ctx.font = '700 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.name, colX + 42, macroGridY + 30);

    // Big Grams
    ctx.fillStyle = "#fafafa";
    ctx.font = '800 40px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${m.grams}g`, colX + 24, macroGridY + 84);

    // Target text
    ctx.fillStyle = "#a1a1aa";
    ctx.font = '500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`of ${m.target}g (${m.percent}%)`, colX + 24, macroGridY + 118);

    // Progress Bar
    const mBarX = colX + 24;
    const mBarY = macroGridY + 144;
    const mBarW = macroColW - 48;
    const mBarH = 10;

    ctx.fillStyle = "#22222c";
    drawRoundedRect(ctx, mBarX, mBarY, mBarW, mBarH, 5);
    ctx.fill();

    const mProgressW = Math.max(6, (mBarW * Math.min(100, m.percent)) / 100);
    ctx.fillStyle = m.color;
    drawRoundedRect(ctx, mBarX, mBarY, mProgressW, mBarH, 5);
    ctx.fill();

    // Bottom calories & % split info
    ctx.fillStyle = "#a1a1aa";
    ctx.font = '500 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${m.cals} kcal`, colX + 24, macroGridY + 192);

    ctx.textAlign = "right";
    ctx.fillText(`${m.ratio}% energy`, colX + macroColW - 24, macroGridY + 192);
    ctx.textAlign = "left";
  });

  // 6. Macro Distribution Split Bar
  const distY = 840;
  const distH = 140;
  const distW = 880;
  const distX = 100;

  ctx.fillStyle = "#1a1a22";
  drawRoundedRect(ctx, distX, distY, distW, distH, 20);
  ctx.fill();

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, distX, distY, distW, distH, 20);
  ctx.stroke();

  ctx.fillStyle = "#a1a1aa";
  ctx.font = '600 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("CALORIE DISTRIBUTION", distX + 28, distY + 36);

  // Stacked Strip
  const stripX = distX + 28;
  const stripY = distY + 54;
  const stripW = distW - 56;
  const stripH = 16;

  // Background
  ctx.fillStyle = "#22222c";
  drawRoundedRect(ctx, stripX, stripY, stripW, stripH, 8);
  ctx.fill();

  const pW = (stripW * pRatio) / 100;
  const cW = (stripW * cRatio) / 100;
  const fW = stripW - pW - cW;

  // Draw segments
  ctx.save();
  drawRoundedRect(ctx, stripX, stripY, stripW, stripH, 8);
  ctx.clip();

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(stripX, stripY, pW, stripH);

  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(stripX + pW, stripY, cW, stripH);

  ctx.fillStyle = "#ef4444";
  ctx.fillRect(stripX + pW + cW, stripY, fW, stripH);
  ctx.restore();

  // Legend underneath
  const legendY = distY + 104;
  ctx.font = '600 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Protein
  ctx.fillStyle = "#22c55e";
  drawRoundedRect(ctx, distX + 28, legendY - 8, 10, 10, 5);
  ctx.fill();
  ctx.fillStyle = "#fafafa";
  ctx.fillText(`Protein ${pRatio}%`, distX + 46, legendY);

  // Carbs
  ctx.fillStyle = "#3b82f6";
  drawRoundedRect(ctx, distX + 200, legendY - 8, 10, 10, 5);
  ctx.fill();
  ctx.fillStyle = "#fafafa";
  ctx.fillText(`Carbs ${cRatio}%`, distX + 218, legendY);

  // Fats
  ctx.fillStyle = "#ef4444";
  drawRoundedRect(ctx, distX + 360, legendY - 8, 10, 10, 5);
  ctx.fill();
  ctx.fillStyle = "#fafafa";
  ctx.fillText(`Fats ${fRatio}%`, distX + 378, legendY);

  // 7. Highlight / Verified Ribbon
  const ribbonY = 1008;
  const ribbonW = 880;
  const ribbonH = 90;
  const ribbonX = 100;

  ctx.fillStyle = "#1a1a22";
  drawRoundedRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 18);
  ctx.fill();

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 18);
  ctx.stroke();

  ctx.fillStyle = "#22c55e";
  ctx.font = '700 20px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("⚡ Consistency & Nutrition Tracker", ribbonX + 28, ribbonY + 48);

  ctx.fillStyle = "#a1a1aa";
  ctx.font = '500 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "right";
  ctx.fillText("Verified on MacroTrackr", ribbonX + ribbonW - 28, ribbonY + 48);

  // 8. Footer Watermark
  const footerY = 1144;
  ctx.fillStyle = "#71717a";
  ctx.font = '500 16px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("macrotrackr.com • Precision Nutrition Tracking", CANVAS_WIDTH / 2, footerY);

  return canvas;
}

/**
 * Converts a Canvas to a PNG Blob
 */
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
    } else if (typeof canvas.toDataURL === "function") {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        if (!base64Data) {
          reject(new Error("Invalid canvas data URL"));
          return;
        }
        const binary = atob(base64Data);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        resolve(new Blob([array], { type: "image/png" }));
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error("Canvas export not supported in this environment"));
    }
  });
}

/**
 * Generates a PNG Blob from snapshot data
 */
export async function generateSnapshotBlob(data: MacroSnapshotData): Promise<Blob> {
  const canvas = renderSnapshotToCanvas(data);
  return canvasToBlob(canvas);
}

/**
 * Downloads the scorecard PNG image to user's device
 */
export async function downloadSnapshotImage(
  data: MacroSnapshotData,
  filename?: string,
): Promise<void> {
  const blob = await generateSnapshotBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeDate = (data.dateLabel ?? "today").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  link.download = filename ?? `macrotrackr-snapshot-${safeDate}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copies the scorecard PNG image to clipboard
 */
export async function copySnapshotToClipboard(data: MacroSnapshotData): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    throw new Error("Clipboard image write not supported in this browser");
  }

  const blob = await generateSnapshotBlob(data);
  const item = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([item]);
  return true;
}

/**
 * Shares the scorecard using Web Share API (with image file or fallback text)
 */
export async function shareSnapshot(data: MacroSnapshotData): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    throw new Error("Web Share API not supported in this browser");
  }

  const blob = await generateSnapshotBlob(data);
  const safeDate = (data.dateLabel ?? "snapshot").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `macrotrackr-${safeDate}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  const sharePayload = {
    title: data.title ?? "MacroTrackr Daily Snapshot",
    text: `Tracked my macros on MacroTrackr! Calories: ${Math.round(data.calories)} / ${Math.round(data.calorieTarget)} kcal (Protein: ${Math.round(data.protein)}g, Carbs: ${Math.round(data.carbs)}g, Fats: ${Math.round(data.fats)}g).`,
  };

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      ...sharePayload,
      files: [file],
    });
    return true;
  }

  await navigator.share(sharePayload);
  return true;
}

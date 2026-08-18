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
 * Official MacroTrackr Pea Pod SVG path
 */
const BRAND_PATH_DATA =
  "M886.77 298.42C889.15 297.85 892.92 297.66 895.3 298.28C900.6 299.67 906.19 306.98 905.75 312.43C905.69 313.23 905.17 313.8 905.01 314.56C904.82 315.48 904.96 316.43 904.73 317.33C904.12 319.64 902.45 321.89 901.52 324.11C900.34 326.96 899.18 329.86 898.08 332.74C897.01 335.55 896.42 338.39 895.69 341.28C895.24 343.04 894.22 344.74 893.89 346.54C893.72 347.46 893.97 348.41 893.78 349.35C893.63 350.14 893.05 350.71 892.92 351.54C892.72 352.81 893.05 354.05 892.79 355.34C892.62 356.14 892.03 356.68 891.9 357.54C891.68 359.17 892.31 360.83 892.03 362.48C891.84 363.6 891.09 364.41 890.91 365.54C890.71 366.84 891.18 368.18 891.01 369.49C890.82 370.93 889.98 372.06 889.77 373.5C889.14 377.74 890.35 382.22 890.02 386.5C889.88 388.3 889.09 389.76 888.84 391.5C888.42 394.46 889.29 397.51 888.89 400.49C888.7 401.89 887.99 403.09 887.82 404.5C887.52 407.15 888.33 409.86 887.89 412.51C887.72 413.57 887.11 414.43 886.95 415.5C886.77 416.8 887.04 418.11 886.81 419.42C886.62 420.51 886.05 421.37 885.93 422.5C885.8 423.82 886.19 425.16 886 426.48C885.84 427.59 885.21 428.44 885.03 429.54C884.88 430.5 885.17 431.5 885.01 432.47C884.87 433.3 884.33 433.91 884.17 434.7C883.99 435.62 884.21 436.56 884.02 437.47C883.85 438.29 883.32 438.9 883.15 439.69C882.94 440.6 883.11 441.52 882.91 442.44C882.47 444.5 881.57 446.51 881.07 448.56C874.83 474 864.26 496.65 850.42 518.96C847.05 524.4 842.83 529.37 838.93 534.43C831.26 544.39 823.03 553.75 814.04 562.55C801.91 574.41 789.42 586.16 775.79 596.31C757.21 610.16 737.44 622.42 717.18 633.65C667.14 661.4 613.29 682.42 558.67 699.25C495.78 718.63 432.63 733.92 367 739.66C346.54 741.45 326.04 741.64 305.5 741.11C301.18 741 296.81 741.26 292.5 740.98C274.23 739.78 255.84 738.95 237.5 739.15C230.92 739.22 224.12 739.72 217.57 740.38C208.52 741.3 198.03 741.91 192.41 733.09C187.74 725.76 190.36 717.27 191.66 709.42C192.16 706.43 192.46 703.45 193.01 700.46C193.34 698.67 194.11 696.95 194.57 695.2C196.35 688.4 198.39 681.77 200.47 675.03C211.18 640.3 235.58 604.26 261.33 578.82C263.19 576.98 264.83 574.94 266.64 573.05C271.95 567.48 277.98 562.32 283.88 557.41C289.72 552.55 295.3 547.29 301.59 543.03C311.9 536.06 321.8 528.54 332.3 521.82C346.53 512.73 361.46 504.84 376.22 496.74C384.82 492.02 393.38 487.01 402.17 482.65C417.99 474.8 433.87 467.1 449.76 459.35C453.18 457.68 456.86 456.51 460.24 454.77C472.21 448.6 484.68 443.22 496.76 437.32C503.11 434.21 509.93 431.96 516.28 428.8C529.99 421.99 544.14 415.68 558.27 409.79C568.04 405.73 577.48 400.9 587.25 396.83C598.47 392.15 609.52 387.05 620.68 382.24C624.47 380.61 628.43 379.3 632.28 377.81C643.62 373.43 654.9 368.8 666.4 364.89C679.56 360.42 692.51 355.41 705.83 351.44C708.98 350.5 712.17 349.78 715.33 348.9C719.12 347.85 722.86 346.26 726.68 345.33C728.58 344.86 730.56 344.67 732.45 344.1C740.71 341.61 749.23 339.22 757.71 337.41C761.9 336.51 766.19 335.91 770.35 334.95C778.11 333.16 785.98 331.04 793.83 329.49C799 328.47 804.3 328.25 809.46 327.11C810.26 326.94 810.89 326.42 811.66 326.24C812.9 325.97 814.18 326.05 815.43 325.82C824.79 324.16 834.19 322.06 843.45 319.94C852.91 317.76 862.58 313.41 871.03 308.55C876.41 305.45 880.46 299.92 886.77 298.42ZM850.91 344.5C848.34 343.97 845.3 343.55 842.61 344.07C841.52 344.28 840.66 344.84 839.5 344.99C837.88 345.19 836.22 344.97 834.6 345.23C830.51 345.9 826.44 347.06 822.38 347.76C820.83 348.03 819.23 347.8 817.69 348.16C816.89 348.35 816.3 348.9 815.47 349.07C814.23 349.31 812.92 348.97 811.69 349.22C810.56 349.45 809.63 350.31 808.47 350.53C807.6 350.69 806.42 350.24 805.55 350.38C804.27 350.59 802.86 350.8 801.55 351.03C800.77 351.17 800.15 351.64 799.39 351.79C797.83 352.09 796.27 351.84 794.73 352.13C794.23 352.23 793.84 352.66 793.35 352.8C790.07 353.78 786.5 353.88 783.18 354.63C782.18 354.86 781.26 355.39 780.26 355.6C777.71 356.14 775.06 356.3 772.54 356.92C770.46 357.43 768.45 358.39 766.39 358.91C756.23 361.44 745.87 363.72 735.74 366.12C730.57 367.34 725.72 369.91 720.57 371.35C716.68 372.45 712.63 373.18 708.73 374.12C706.28 374.7 703.81 375.98 701.36 376.76C698.61 377.63 695.91 378.76 693.17 379.57C690.4 380.39 687.36 380.96 684.74 382.18C683.9 382.56 683.29 383.22 682.42 383.55C681.35 383.97 679.93 383.97 678.8 384.37C676.18 385.29 673.72 386.73 671.05 387.5C661.86 390.15 652.69 393.72 643.73 397.15C639.73 398.68 636.1 400.99 632.16 402.64C630.73 403.24 629.09 403.44 627.71 404.14C627.02 404.49 626.54 405.11 625.85 405.45C623.98 406.35 621.73 406.58 619.79 407.34C613.19 409.9 606.6 412.69 600.16 415.62C584.1 422.95 567.78 429.91 551.75 437.18C543.53 440.9 535.53 445.09 527.28 448.76C524.47 450.01 521.45 450.79 518.7 452.16C505.03 459.01 490.91 464.99 477.06 471.54C470.11 474.82 463.36 478.8 456.3 481.8C448.75 485.02 441.14 488.61 433.78 492.29C427.38 495.48 421.3 499.34 414.84 502.37C395.33 511.53 376.46 522.18 358.31 533.77C355.86 535.33 353.15 536.57 350.66 538.09C341.43 543.72 332.46 549.83 323.82 556.27C313.56 563.92 302.46 571.99 293.16 580.75C291.99 581.85 291.13 583.31 289.91 584.42C267.45 604.68 247.23 629.5 234.77 657.25C230.5 666.79 226.28 676.09 223.63 686.2C222.47 690.6 220.41 695.2 220.5 699.76C223.97 698.71 227 696.38 230.25 694.67C236.87 691.2 243.75 688.06 250.61 685.09C259.93 681.06 269.61 677.55 279.35 674.74C289.42 671.83 299.42 668.33 309.67 666.17C320.93 663.81 332.26 661.02 343.53 658.99C348.71 658.05 354.01 657.54 359.21 656.57C365.26 655.44 371.36 654.08 377.47 653.15C379.37 652.87 381.32 652.94 383.22 652.58C411.22 647.33 439.38 642.73 467.26 636.68C484.24 632.99 500.99 627.93 517.72 623.22C555.28 612.67 592.29 599.74 627.67 583.13C642.06 576.38 656.9 570.17 670.72 562.29C672.42 561.32 673.94 560.04 675.64 559.09C684.4 554.17 693.42 549.75 701.96 544.47C705.84 542.07 709.32 539.1 713.1 536.6C715.73 534.86 718.74 533.67 721.33 531.83C729.31 526.14 737.23 520.47 745.11 514.63C746.28 513.77 747.68 513.22 748.84 512.33C752.22 509.73 755.16 506.56 758.53 503.99C788.21 481.32 814.83 452.3 833.45 419.89C835.91 415.6 837.5 410.63 839.62 406.15C843.37 398.23 846.59 389.8 848.61 381.23C849.21 378.71 849.37 376.02 850.04 373.53C850.33 372.47 850.91 371.55 851.08 370.47C851.32 368.85 850.74 367.15 851.02 365.53C851.22 364.41 851.95 363.59 852.15 362.47C852.64 359.73 852.57 351.31 852.13 348.53C851.93 347.21 851.28 345.8 850.91 344.5ZM713.5 522.29C711.67 514.15 712.89 503.97 712.92 495.5C712.98 478.83 713.04 462.17 713.11 445.5C713.14 435.99 711.6 421.14 715.21 412.69C718.62 404.68 726.56 395.95 735.12 393.55C741.48 391.76 747.97 392.26 754.5 392.24C762.57 392.21 770.9 392.41 778.16 396.39C786.75 401.11 793.12 409.94 794.53 419.82C794.84 422.02 794.5 424.29 794.54 426.5C794.61 430.53 794.66 434.47 794.54 438.5C794.43 442.13 795.41 452.19 794.44 454.98C793.76 456.92 790.94 458.6 789.55 460.06C785.15 464.69 780.85 469.31 776.1 473.57C772.94 476.4 770.24 479.75 767.05 482.57C764.21 485.08 761.02 487.24 758.13 489.66C755.63 491.75 753.57 494.48 750.95 496.47C744.91 501.07 738.8 505.62 732.65 510.08C728.37 513.19 724.08 516.26 719.68 519.19C718.34 520.08 717.04 521.61 715.46 522.06C714.83 522.24 714.14 522.15 713.5 522.29ZM694.5 535.4C672.94 548.56 650.82 560.94 627.75 571.32C622.7 573.59 617.77 576.05 612.65 578.19C609.17 579.65 607.74 581.02 603.92 580.5C600.89 570.43 604.05 556.2 603.65 545.56C603.47 540.91 603.25 536.19 603.43 531.5C603.51 529.49 603.93 527.54 603.9 525.5C603.71 512.19 603.92 498.83 603.93 485.5C603.94 478.5 603.96 471.5 603.97 464.5C603.97 461.03 603.48 457.01 604.15 453.62C604.3 452.88 604.84 452.2 605.03 451.45C605.68 448.92 605.93 446.04 607.2 443.65C608.29 441.59 610.11 439.84 611.46 437.92C616.16 431.29 622.72 427.17 630.52 424.86C636.71 423.02 644.1 424.1 650.5 424.09C656.8 424.08 663.26 423.63 669.38 425.26C681.22 428.41 692.78 440.28 694.65 452.66C695.33 457.16 694.95 461.96 694.93 466.5C694.9 474.51 695.19 482.57 695.09 490.5C695.04 494.86 695.67 499.2 695.88 503.53C696.16 509.18 695.95 514.9 695.57 520.5C695.22 525.48 695.77 530.52 694.5 535.4ZM587.91 587.5C585.51 589.66 582.72 590.22 579.79 591.43C574.52 593.6 569.18 595.47 563.81 597.42C547.61 603.28 531.31 608.58 514.78 613.37C506.46 615.78 498.1 619.1 489.5 620.11C488.69 619.24 487.89 618.65 487.48 617.48C486.79 615.45 487.31 610.21 487.35 607.97C487.51 599.49 487.65 591 487.69 582.5C487.73 573.17 488.12 563.83 488.09 554.5C488.06 546.5 487.92 538.5 487.92 530.5C487.92 527.27 487.5 523.72 487.98 520.52C488.1 519.71 488.57 519.06 488.7 518.27C489.49 513.18 489.33 509.98 491.48 504.94C493.05 501.29 495.42 498.39 498 495.46C500.91 492.15 503.77 489.35 507.75 487.3C510.61 485.82 513.58 484.03 516.75 483.33C524.57 481.62 532.48 482.14 540.5 482.07C548.73 482.01 554.95 482.03 562.82 484.63C566.67 485.9 569.96 487.98 573 490.54C577.83 494.61 582.38 499.64 584.9 505.6C588.25 513.52 587.99 522.1 587.96 530.5C587.93 538.83 588 547.17 588.04 555.5C588.09 566.12 588.68 576.91 587.91 587.5ZM472.5 623.22C470.05 625.46 466.91 625.65 463.76 626.36C457.44 627.79 451.17 629.17 444.8 630.48C434.34 632.62 424 635.27 413.49 637.05C407.21 638.12 400.85 639.03 394.56 640.26C388.54 641.44 382.58 642.21 376.54 643.17C374.33 643.52 372.82 644 370.5 643.88C368.08 640.92 368.88 637.18 368.86 633.5C368.82 625.84 368.8 618.16 368.92 610.5C369.02 604.78 369.21 599.16 369.69 593.5C369.89 591.13 369.45 588.84 369.53 586.5C369.62 584.02 370.45 581.04 371.18 578.67C371.99 576.06 373.69 573.76 374.85 571.31C375.77 569.38 376.63 567.26 377.97 565.57C379.69 563.41 384.53 558.58 386.92 557.48C387.89 557.03 388.95 556.83 389.89 556.34C390.7 555.91 391.34 555.1 392.19 554.66C395.09 553.13 398.25 552.78 401.28 551.85C401.63 551.74 402.29 551.22 402.65 551.14C406.75 550.32 411.35 551.02 415.5 550.97C416.87 550.96 418.17 550.47 419.49 550.43C422.4 550.33 425.55 550.87 428.5 551C431.14 551.12 433.89 550.72 436.5 550.98C443.53 551.66 453.83 555.53 459.02 560.47C461.14 562.49 462.54 564.98 464.31 567.23C469.19 573.43 471.83 580.68 473 588.52C473.76 593.63 473.06 599.33 473.07 604.5C473.08 610.64 473.76 617.26 472.5 623.22Z";

/**
 * Draws the MacroTrackr pea-pod logo mark onto a Canvas
 */
function drawBrandLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);

  // Background squircle for badge
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, "#10b981");
  bgGrad.addColorStop(1, "#059669");
  ctx.fillStyle = bgGrad;
  drawRoundedRect(ctx, 0, 0, size, size, size * 0.28);
  ctx.fill();

  // Subtle border glow
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, 0, 0, size, size, size * 0.28);
  ctx.stroke();

  // Draw official vector BrandMark path if Path2D is supported
  if (typeof Path2D !== "undefined") {
    try {
      const brandPath = new Path2D(BRAND_PATH_DATA);
      ctx.save();
      const scale = (size * 0.68) / 733;
      ctx.translate(size * 0.16, size * 0.16);
      ctx.scale(scale, scale);
      ctx.translate(-181, -289);
      ctx.fillStyle = "#ffffff";
      ctx.fill(brandPath);
      ctx.restore();
      ctx.restore();
      return;
    } catch {
      // Fall through to procedural fallback
    }
  }

  // Procedural vector fallback
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.5, size * 0.38, size * 0.22, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

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
  const proteinPercent = Math.round((proteinG / proteinTargetG) * 100);

  const carbsG = Math.round(data.carbs);
  const carbsTargetG = Math.round(data.carbsTarget) || 200;
  const carbsPercent = Math.round((carbsG / carbsTargetG) * 100);

  const fatsG = Math.round(data.fats);
  const fatsTargetG = Math.round(data.fatsTarget) || 65;
  const fatsPercent = Math.round((fatsG / fatsTargetG) * 100);

  const proteinCals = proteinG * 4;
  const carbsCals = carbsG * 4;
  const fatsCals = fatsG * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals;

  const pRatio = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 30;
  const cRatio = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 45;
  const fRatio = totalMacroCals > 0 ? Math.max(0, 100 - pRatio - cRatio) : 25;

  // 1. Full Canvas Background with atmospheric glows
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, "#08090c");
  bgGrad.addColorStop(1, "#0d1017");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Atmospheric radial lighting
  const topGlow = ctx.createRadialGradient(280, 160, 20, 280, 160, 520);
  topGlow.addColorStop(0, "rgba(16, 185, 129, 0.16)");
  topGlow.addColorStop(0.6, "rgba(16, 185, 129, 0.04)");
  topGlow.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const bottomGlow = ctx.createRadialGradient(880, 1050, 20, 880, 1050, 580);
  bottomGlow.addColorStop(0, "rgba(56, 189, 248, 0.10)");
  bottomGlow.addColorStop(0.7, "rgba(56, 189, 248, 0.02)");
  bottomGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Main Card Container (992 x 1262, radius 36)
  const cardX = 44;
  const cardY = 44;
  const cardW = CANVAS_WIDTH - 88;
  const cardH = CANVAS_HEIGHT - 88;

  ctx.fillStyle = "#11141c";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.stroke();

  // Subtle top highlight inside card
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + 1.5);
  ctx.lineTo(cardX + cardW - 40, cardY + 1.5);
  ctx.stroke();

  const contentX = 84;
  const contentW = CANVAS_WIDTH - 168; // 912px

  // 3. Header Section (Logo, App Name, Badge)
  const headerY = 88;
  drawBrandLogo(ctx, contentX, headerY, 56);

  // Brand Name & Subtitle
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 28px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MacroTrackr", contentX + 72, headerY + 34);

  ctx.fillStyle = "#10b981";
  ctx.font = '700 12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("PRECISION NUTRITION", contentX + 74, headerY + 50);

  // Status Badge on the right
  const badgeText =
    data.badgeLabel ??
    (data.streakDays && data.streakDays > 0
      ? `🔥 ${data.streakDays}-Day Streak`
      : data.complianceScore
        ? `⚡ ${data.complianceScore}% Compliance`
        : `🎯 ${calPercent}% of Goal`);

  ctx.font = '700 17px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 36;
  const badgeX = contentX + contentW - badgeWidth;
  const badgeY = headerY + 8;
  const badgeH = 42;

  ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeH, 21);
  ctx.fill();

  ctx.strokeStyle = "rgba(16, 185, 129, 0.32)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeH, 21);
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeH / 2);

  // Title / Date Header
  const titleY = 188;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#71717a";
  ctx.font = '700 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText((data.title ?? "DAILY NUTRITION SCORECARD").toUpperCase(), contentX, titleY);

  ctx.fillStyle = "#fafafa";
  ctx.font = '800 32px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.dateLabel ?? "Today's Macro Summary", contentX, titleY + 38);

  // 4. Hero Energy (Calories) Card
  const heroY = 254;
  const heroH = 244;
  const heroW = contentW;
  const heroX = contentX;

  ctx.fillStyle = "#161a24";
  drawRoundedRect(ctx, heroX, heroY, heroW, heroH, 26);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, heroX, heroY, heroW, heroH, 26);
  ctx.stroke();

  // Top header inside Hero Card
  ctx.fillStyle = "#94a3b8";
  ctx.font = '700 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("CALORIES CONSUMED", heroX + 36, heroY + 44);

  ctx.textAlign = "right";
  ctx.fillStyle = "#64748b";
  ctx.font = '600 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Target: ${targetCal.toLocaleString()} kcal`, heroX + heroW - 36, heroY + 44);
  ctx.textAlign = "left";

  // Big Calorie Number
  ctx.fillStyle = "#ffffff";
  ctx.font = '900 76px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const calString = cal.toLocaleString();
  ctx.fillText(calString, heroX + 36, heroY + 120);

  const calNumWidth = ctx.measureText(calString).width;
  ctx.fillStyle = "#94a3b8";
  ctx.font = '700 28px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("kcal", heroX + 48 + calNumWidth, heroY + 120);

  const kcalWidth = ctx.measureText("kcal").width;
  ctx.fillStyle = "#64748b";
  ctx.font = '600 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`/ ${targetCal.toLocaleString()} goal`, heroX + 64 + calNumWidth + kcalWidth, heroY + 120);

  // Progress Bar for Calories
  const barX = heroX + 36;
  const barY = heroY + 154;
  const barW = heroW - 72;
  const barH = 20;

  // Track
  ctx.fillStyle = "#222736";
  drawRoundedRect(ctx, barX, barY, barW, barH, 10);
  ctx.fill();

  // Progress fill
  const calProgressW = Math.max(16, (barW * Math.min(100, calPercent)) / 100);
  const calBarGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  calBarGrad.addColorStop(0, "#10b981");
  calBarGrad.addColorStop(0.7, "#34d399");
  calBarGrad.addColorStop(1, "#4ade80");
  ctx.fillStyle = calBarGrad;
  drawRoundedRect(ctx, barX, barY, calProgressW, barH, 10);
  ctx.fill();

  // Calorie Subtext: % and remaining
  ctx.font = '700 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = "#34d399";

  // Indicator circle
  ctx.beginPath();
  ctx.arc(barX + 6, barY + 44, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillText(`${calPercent}% of Daily Target`, barX + 18, barY + 49);

  const remaining = targetCal - cal;
  ctx.fillStyle = "#94a3b8";
  ctx.font = '600 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "right";
  ctx.fillText(
    remaining >= 0 ? `${remaining.toLocaleString()} kcal remaining` : `${Math.abs(remaining).toLocaleString()} kcal over target`,
    barX + barW,
    barY + 49,
  );
  ctx.textAlign = "left";

  // 5. Macro Breakdown: 3 Columns
  const macroGridY = 526;
  const macroGap = 20;
  const macroColW = (contentW - macroGap * 2) / 3; // (912 - 40) / 3 = 290.66
  const macroColH = 262;

  const macros = [
    {
      name: "PROTEIN",
      color: "#10b981",
      accent: "#34d399",
      bgPill: "rgba(16, 185, 129, 0.12)",
      grams: proteinG,
      target: proteinTargetG,
      percent: proteinPercent,
      cals: proteinCals,
      ratio: pRatio,
    },
    {
      name: "CARBS",
      color: "#0ea5e9",
      accent: "#38bdf8",
      bgPill: "rgba(14, 165, 233, 0.12)",
      grams: carbsG,
      target: carbsTargetG,
      percent: carbsPercent,
      cals: carbsCals,
      ratio: cRatio,
    },
    {
      name: "FATS",
      color: "#f43f5e",
      accent: "#fb7185",
      bgPill: "rgba(244, 63, 94, 0.12)",
      grams: fatsG,
      target: fatsTargetG,
      percent: fatsPercent,
      cals: fatsCals,
      ratio: fRatio,
    },
  ];

  macros.forEach((m, index) => {
    const colX = contentX + index * (macroColW + macroGap);

    // Card Surface
    ctx.fillStyle = "#161a24";
    drawRoundedRect(ctx, colX, macroGridY, macroColW, macroColH, 22);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, colX, macroGridY, macroColW, macroColH, 22);
    ctx.stroke();

    // Top Header Pill
    const tagX = colX + 22;
    const tagY = macroGridY + 22;

    ctx.fillStyle = m.bgPill;
    drawRoundedRect(ctx, tagX, tagY, 110, 28, 14);
    ctx.fill();

    // Dot
    ctx.fillStyle = m.accent;
    ctx.beginPath();
    ctx.arc(tagX + 14, tagY + 14, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Macro Name
    ctx.font = '800 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(m.name, tagX + 26, tagY + 19);

    // Big Grams Value
    ctx.fillStyle = "#ffffff";
    ctx.font = '800 46px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const gramsStr = `${m.grams}`;
    ctx.fillText(gramsStr, colX + 22, macroGridY + 98);

    const gNumW = ctx.measureText(gramsStr).width;
    ctx.fillStyle = "#94a3b8";
    ctx.font = '700 24px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText("g", colX + 26 + gNumW, macroGridY + 98);

    // Target label
    ctx.fillStyle = "#94a3b8";
    ctx.font = '600 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`of ${m.target}g (${m.percent}%)`, colX + 22, macroGridY + 134);

    // Progress Bar
    const mBarX = colX + 22;
    const mBarY = macroGridY + 158;
    const mBarW = macroColW - 44;
    const mBarH = 10;

    ctx.fillStyle = "#222736";
    drawRoundedRect(ctx, mBarX, mBarY, mBarW, mBarH, 5);
    ctx.fill();

    const mProgressW = Math.max(6, (mBarW * Math.min(100, m.percent)) / 100);
    const mGrad = ctx.createLinearGradient(mBarX, 0, mBarX + mBarW, 0);
    mGrad.addColorStop(0, m.color);
    mGrad.addColorStop(1, m.accent);
    ctx.fillStyle = mGrad;
    drawRoundedRect(ctx, mBarX, mBarY, mProgressW, mBarH, 5);
    ctx.fill();

    // Bottom calories & % split info
    ctx.fillStyle = "#ffffff";
    ctx.font = '700 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${m.cals} kcal`, colX + 22, macroGridY + 218);

    ctx.textAlign = "right";
    ctx.fillStyle = "#71717a";
    ctx.font = '600 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${m.ratio}% energy`, colX + macroColW - 22, macroGridY + 218);
    ctx.textAlign = "left";
  });

  // 6. Macro Distribution Split Bar
  const distY = 814;
  const distH = 154;
  const distW = contentW;
  const distX = contentX;

  ctx.fillStyle = "#161a24";
  drawRoundedRect(ctx, distX, distY, distW, distH, 22);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, distX, distY, distW, distH, 22);
  ctx.stroke();

  ctx.fillStyle = "#94a3b8";
  ctx.font = '700 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("MACRONUTRIENT DISTRIBUTION", distX + 28, distY + 38);

  ctx.textAlign = "right";
  ctx.fillStyle = "#64748b";
  ctx.font = '600 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${totalMacroCals.toLocaleString()} total macro kcal`, distX + distW - 28, distY + 38);
  ctx.textAlign = "left";

  // Stacked Strip
  const stripX = distX + 28;
  const stripY = distY + 54;
  const stripW = distW - 56;
  const stripH = 20;

  // Background
  ctx.fillStyle = "#222736";
  drawRoundedRect(ctx, stripX, stripY, stripW, stripH, 10);
  ctx.fill();

  const pW = (stripW * pRatio) / 100;
  const cW = (stripW * cRatio) / 100;
  const fW = stripW - pW - cW;

  // Draw segments
  ctx.save();
  drawRoundedRect(ctx, stripX, stripY, stripW, stripH, 10);
  ctx.clip();

  ctx.fillStyle = "#10b981";
  ctx.fillRect(stripX, stripY, pW, stripH);

  ctx.fillStyle = "#0ea5e9";
  ctx.fillRect(stripX + pW, stripY, cW, stripH);

  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(stripX + pW + cW, stripY, fW, stripH);
  ctx.restore();

  // Legend underneath
  const legendY = distY + 118;
  ctx.font = '700 15px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Protein
  ctx.fillStyle = "#34d399";
  ctx.beginPath();
  ctx.arc(distX + 36, legendY - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Protein ${pRatio}%`, distX + 48, legendY);

  // Carbs
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.arc(distX + 236, legendY - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Carbs ${cRatio}%`, distX + 248, legendY);

  // Fats
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.arc(distX + 416, legendY - 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Fats ${fRatio}%`, distX + 428, legendY);

  // 7. Verified Log Footer Card
  const ribbonY = 994;
  const ribbonW = contentW;
  const ribbonH = 92;
  const ribbonX = contentX;

  ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
  drawRoundedRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 20);
  ctx.fill();

  ctx.strokeStyle = "rgba(16, 185, 129, 0.24)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, 20);
  ctx.stroke();

  // Shield Check Icon
  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  ctx.arc(ribbonX + 44, ribbonY + 46, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 18px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✓", ribbonX + 44, ribbonY + 46);

  // Text
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fafafa";
  ctx.font = '800 18px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("Verified MacroTrackr Log", ribbonX + 74, ribbonY + 42);

  ctx.fillStyle = "#94a3b8";
  ctx.font = '500 13px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText("Precision daily nutrition and compliance tracking", ribbonX + 74, ribbonY + 64);

  // Right pill
  const linkPillW = 160;
  const linkPillH = 38;
  const linkPillX = ribbonX + ribbonW - linkPillW - 24;
  const linkPillY = ribbonY + (ribbonH - linkPillH) / 2;

  ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
  drawRoundedRect(ctx, linkPillX, linkPillY, linkPillW, linkPillH, 19);
  ctx.fill();

  ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, linkPillX, linkPillY, linkPillW, linkPillH, 19);
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = '700 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("macrotrackr.com", linkPillX + linkPillW / 2, linkPillY + linkPillH / 2);

  // 8. Bottom Brand Watermark
  const footerY = 1132;
  ctx.fillStyle = "#52525b";
  ctx.font = '600 14px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MacroTrackr • Self-Hosted & Cloud Precision Nutrition Tracking", CANVAS_WIDTH / 2, footerY);

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
  const safeDate = (data.dateLabel ?? "today").toLowerCase().replace(/[^\da-z]+/g, "-");
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
  const safeDate = (data.dateLabel ?? "snapshot").toLowerCase().replace(/[^\da-z]+/g, "-");
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

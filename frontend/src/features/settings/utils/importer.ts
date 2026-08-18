// src/features/settings/utils/importer.ts

export type ImportFormat =
  | "myfitnesspal"
  | "cronometer"
  | "macrofactor"
  | "loseit"
  | "macrotrackr"
  | "auto"
  | "unknown";

export interface ParsedMacroEntry {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealName?: string;
  entryDate: string; // YYYY-MM-DD
  entryTime: string; // HH:MM:SS
  ingredients?: unknown[];
}

export interface ParsedWeightLog {
  timestamp: string; // YYYY-MM-DD or ISO
  weight: number;
}

export interface ImportResult {
  format: ImportFormat;
  entries: ParsedMacroEntry[];
  weightLogs: ParsedWeightLog[];
  summary: {
    totalMeals: number;
    totalWeightLogs: number;
    dateRange: {
      start: string;
      end: string;
    } | null;
    macroSummary: {
      totalCalories: number;
      avgDailyCalories: number;
      avgDailyProtein: number;
      avgDailyCarbs: number;
      avgDailyFats: number;
      uniqueDays: number;
    };
  };
  errors?: string[];
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function normalizeDate(dateStr: unknown): string | null {
  if (typeof dateStr !== "string" || !dateStr.trim()) return null;
  const trimmed = dateStr.trim();

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // MM/DD/YYYY or M/D/YYYY
  const usMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (usMatch && usMatch[1] && usMatch[2] && usMatch[3]) {
    const [, m, d, y] = usMatch;
    const num1 = parseInt(m, 10);
    const num2 = parseInt(d, 10);
    if (num1 > 12 && num2 <= 12) {
      return `${y}-${d.padStart(2, "0")}-${m.padStart(2, "0")}`;
    }
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Timestamp or Date.parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    if (year >= 1990 && year <= 2100) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

export function normalizeMealType(
  rawMealType?: unknown,
): "breakfast" | "lunch" | "dinner" | "snack" {
  if (typeof rawMealType !== "string" || !rawMealType.trim()) return "snack";
  const lower = rawMealType.trim().toLowerCase();

  if (lower.includes("break") || lower.includes("morning") || lower === "m1") {
    return "breakfast";
  }
  if (lower.includes("lunch") || lower.includes("midday") || lower === "m2") {
    return "lunch";
  }
  if (
    lower.includes("din") ||
    lower.includes("supper") ||
    lower.includes("evening") ||
    lower === "m3"
  ) {
    return "dinner";
  }
  return "snack";
}

export function normalizeTime(timeStr?: unknown, mealType?: string): string {
  if (typeof timeStr === "string" && timeStr.trim()) {
    const trimmed = timeStr.trim();
    // 12-hour format e.g. 1:30 PM
    const ampmMatch = trimmed.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([aApP][mM])$/i,
    );
    if (ampmMatch && ampmMatch[1] && ampmMatch[2] && ampmMatch[4]) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2];
      const seconds = ampmMatch[3] || "00";
      const isPm = ampmMatch[4].toLowerCase() === "pm";
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
    }

    // 24-hour format e.g. 14:30 or 14:30:00
    const time24Match = trimmed.match(
      /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
    );
    if (time24Match && time24Match[1] && time24Match[2]) {
      const hours = time24Match[1].padStart(2, "0");
      const minutes = time24Match[2];
      const seconds = time24Match[3] || "00";
      return `${hours}:${minutes}:${seconds}`;
    }
  }

  switch (mealType) {
    case "breakfast":
      return "08:00:00";
    case "lunch":
      return "12:30:00";
    case "dinner":
      return "18:30:00";
    case "snack":
    default:
      return "15:00:00";
  }
}

export function parseNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number") {
    return isNaN(val) ? fallback : Math.max(0, val);
  }
  if (typeof val !== "string") return fallback;

  const cleaned = val.replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : Math.max(0, Math.round(num * 10) / 10);
}

export function detectImportFormat(
  content: string,
  filename?: string,
): ImportFormat {
  const trimmed = content.trim();

  // 1. Check if JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed.source === "macrotrackr" ||
        parsed.version === "1.0" ||
        (Array.isArray(parsed) && parsed[0]?.mealType)
      ) {
        return "macrotrackr";
      }
      if (
        parsed.source === "macrofactor" ||
        parsed.foods ||
        parsed.weights ||
        parsed.macrofactor
      ) {
        return "macrofactor";
      }
      if (Array.isArray(parsed.entries) || Array.isArray(parsed)) {
        return "macrotrackr";
      }
    } catch {
      // not valid JSON, proceed to CSV check
    }
  }

  // 2. CSV check
  const rows = parseCsv(trimmed);
  if (rows.length === 0 || !rows[0]) return "unknown";

  const headerRow = rows[0].map((h) => h.toLowerCase().trim());
  const headerString = headerRow.join(" ");

  if (
    headerString.includes("macrotrackr") ||
    (headerRow.includes("meal type") &&
      headerRow.includes("protein") &&
      headerRow.includes("carbs"))
  ) {
    return "macrotrackr";
  }

  if (
    headerRow.includes("type") &&
    headerRow.includes("quantity") &&
    headerRow.includes("units")
  ) {
    return "loseit";
  }

  if (
    headerString.includes("cronometer") ||
    headerRow.includes("energy (kcal)") ||
    headerRow.includes("net carbs (g)") ||
    (headerRow.includes("food name") && headerRow.includes("group"))
  ) {
    return "cronometer";
  }

  if (
    headerString.includes("macrofactor") ||
    (headerRow.includes("calories (kcal)") && headerRow.includes("meal"))
  ) {
    return "macrofactor";
  }

  if (
    headerRow.includes("meal") &&
    (headerRow.includes("fat (g)") ||
      headerRow.includes("carbohydrates (g)") ||
      headerRow.includes("calories"))
  ) {
    return "myfitnesspal";
  }

  if (filename) {
    const fnLower = filename.toLowerCase();
    if (fnLower.includes("myfitnesspal") || fnLower.includes("mfp"))
      return "myfitnesspal";
    if (fnLower.includes("cronometer")) return "cronometer";
    if (fnLower.includes("macrofactor")) return "macrofactor";
    if (fnLower.includes("loseit") || fnLower.includes("lose it"))
      return "loseit";
    if (fnLower.includes("macrotrackr")) return "macrotrackr";
  }

  return "unknown";
}

function computeSummary(
  entries: ParsedMacroEntry[],
  weightLogs: ParsedWeightLog[],
): ImportResult["summary"] {
  const dates = new Set<string>();
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  for (const entry of entries) {
    dates.add(entry.entryDate);
    const calories =
      Math.round((entry.protein * 4 + entry.carbs * 4 + entry.fats * 9) * 10) /
      10;
    totalCalories += calories;
    totalProtein += entry.protein;
    totalCarbs += entry.carbs;
    totalFats += entry.fats;
  }

  for (const wl of weightLogs) {
    const d = wl.timestamp.split("T")[0];
    if (d) {
      dates.add(d);
    }
  }

  const sortedDates = Array.from(dates).sort();
  const dateRange =
    sortedDates.length > 0 && sortedDates[0] && sortedDates[sortedDates.length - 1]
      ? {
          start: sortedDates[0],
          end: sortedDates[sortedDates.length - 1]!,
        }
      : null;

  const uniqueDays = Math.max(1, sortedDates.length);

  return {
    totalMeals: entries.length,
    totalWeightLogs: weightLogs.length,
    dateRange,
    macroSummary: {
      totalCalories: Math.round(totalCalories),
      avgDailyCalories: Math.round(totalCalories / uniqueDays),
      avgDailyProtein: Math.round((totalProtein / uniqueDays) * 10) / 10,
      avgDailyCarbs: Math.round((totalCarbs / uniqueDays) * 10) / 10,
      avgDailyFats: Math.round((totalFats / uniqueDays) * 10) / 10,
      uniqueDays: sortedDates.length,
    },
  };
}

export function parseImportFile(
  content: string,
  formatOverride?: ImportFormat,
  filename?: string,
): ImportResult {
  const detected =
    formatOverride && formatOverride !== "auto" && formatOverride !== "unknown"
      ? formatOverride
      : detectImportFormat(content, filename);

  const format = detected === "unknown" ? "macrotrackr" : detected;
  const trimmed = content.trim();

  // Try JSON first if format is JSON or content starts with { or [
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return parseJsonImport(parsed, format);
    } catch {
      // fallback to CSV
    }
  }

  return parseCsvImport(content, format);
}

function parseJsonImport(parsed: any, format: ImportFormat): ImportResult {
  const entries: ParsedMacroEntry[] = [];
  const weightLogs: ParsedWeightLog[] = [];
  const errors: string[] = [];

  // MacroTrackr JSON structure or top-level array
  const rawEntries = Array.isArray(parsed)
    ? parsed
    : parsed.entries || parsed.foods || parsed.nutrition || parsed.meals || [];

  const rawWeights = parsed.weightLogs || parsed.weights || parsed.weight || [];

  if (Array.isArray(rawEntries)) {
    for (const item of rawEntries) {
      const entryDate = normalizeDate(item.entryDate || item.date || item.day);
      if (!entryDate) continue;

      const protein = parseNumber(item.protein);
      const carbs = parseNumber(item.carbs ?? item.carbohydrates);
      const fats = parseNumber(item.fats ?? item.fat);
      const mealType = normalizeMealType(
        item.mealType || item.meal || item.type || item.group,
      );
      const mealName = String(
        item.mealName || item.name || item.foodName || item.title || "",
      ).trim();
      const entryTime = normalizeTime(item.entryTime || item.time, mealType);
      const ingredients = Array.isArray(item.ingredients)
        ? item.ingredients
        : undefined;

      entries.push({
        protein,
        carbs,
        fats,
        mealType,
        mealName: mealName || undefined,
        entryDate,
        entryTime,
        ingredients,
      });
    }
  }

  if (Array.isArray(rawWeights)) {
    for (const item of rawWeights) {
      const ts = normalizeDate(item.timestamp || item.date);
      const w = parseNumber(item.weight || item.value);
      if (ts && w > 0) {
        weightLogs.push({
          timestamp: ts,
          weight: w,
        });
      }
    }
  }

  return {
    format,
    entries,
    weightLogs,
    summary: computeSummary(entries, weightLogs),
    errors: errors.length > 0 ? errors : undefined,
  };
}

function parseCsvImport(content: string, format: ImportFormat): ImportResult {
  const rows = parseCsv(content);
  const entries: ParsedMacroEntry[] = [];
  const weightLogs: ParsedWeightLog[] = [];
  const errors: string[] = [];

  if (rows.length < 2 || !rows[0]) {
    return {
      format,
      entries: [],
      weightLogs: [],
      summary: computeSummary([], []),
      errors: ["File is empty or contains only headers."],
    };
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());

  // Find column indices helper
  const findCol = (...names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex(
        (h) => h === name.toLowerCase() || h.includes(name.toLowerCase()),
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx = findCol("date", "day", "timestamp");
  const timeIdx = findCol("time", "entry time");
  const mealIdx = findCol("meal", "meal type", "type", "group");
  const nameIdx = findCol("food name", "name", "food", "description", "note");
  const proteinIdx = findCol("protein (g)", "protein");
  const carbsIdx = findCol(
    "carbohydrates (g)",
    "net carbs (g)",
    "carbs (g)",
    "carbs",
    "carbohydrates",
  );
  const fatIdx = findCol("fat (g)", "total fat (g)", "fat", "fats");
  const weightIdx = findCol(
    "weight (kg)",
    "weight (lbs)",
    "weight",
    "metric weight",
  );

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((cell) => cell.trim() === "")) continue;

    const rawDate = dateIdx !== -1 && row[dateIdx] !== undefined ? row[dateIdx] : undefined;
    const entryDate = normalizeDate(rawDate);
    if (!entryDate) continue;

    const rawMeal = mealIdx !== -1 && row[mealIdx] !== undefined ? row[mealIdx] : undefined;
    const mealType = normalizeMealType(rawMeal);

    const mealName = (nameIdx !== -1 && row[nameIdx] !== undefined ? row[nameIdx] : "") || rawMeal || "";
    const rawTime = timeIdx !== -1 && row[timeIdx] !== undefined ? row[timeIdx] : undefined;
    const entryTime = normalizeTime(rawTime, mealType);

    const protein = proteinIdx !== -1 && row[proteinIdx] !== undefined ? parseNumber(row[proteinIdx]) : 0;
    const carbs = carbsIdx !== -1 && row[carbsIdx] !== undefined ? parseNumber(row[carbsIdx]) : 0;
    const fats = fatIdx !== -1 && row[fatIdx] !== undefined ? parseNumber(row[fatIdx]) : 0;

    // Check if row is purely a weight log entry
    if (weightIdx !== -1 && row[weightIdx]) {
      const weightVal = parseNumber(row[weightIdx]);
      if (weightVal > 0) {
        weightLogs.push({
          timestamp: entryDate,
          weight: weightVal,
        });
      }
    }

    // Only add macro entry if there are valid macros or meal info
    if (protein > 0 || carbs > 0 || fats > 0 || mealName) {
      entries.push({
        protein,
        carbs,
        fats,
        mealType,
        mealName: mealName ? mealName.trim() : undefined,
        entryDate,
        entryTime,
      });
    }
  }

  return {
    format,
    entries,
    weightLogs,
    summary: computeSummary(entries, weightLogs),
    errors: errors.length > 0 ? errors : undefined,
  };
}

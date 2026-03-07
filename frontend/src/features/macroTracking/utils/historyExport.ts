import type { Ingredient, MacroEntry } from "@/types/macro";

const HISTORY_EXPORT_HEADERS = [
  "Entry Date",
  "Entry Time",
  "Meal Type",
  "Entry Name",
  "Protein (g)",
  "Carbs (g)",
  "Fats (g)",
  "Calories (kcal)",
  "Ingredient Count",
  "Ingredient Names",
  "Ingredient Details",
  "Created At",
];

function calculateCalories(entry: MacroEntry) {
  return Math.round(entry.protein * 4 + entry.carbs * 4 + entry.fats * 9);
}

function escapeCsvValue(value: string | number | undefined) {
  const normalized = value === undefined ? "" : String(value);
  const escaped = normalized.replaceAll('"', '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function formatIngredient(ingredient: Ingredient) {
  const quantity =
    typeof ingredient.quantity === "number" ? ingredient.quantity : undefined;
  const amount =
    quantity !== undefined && ingredient.unit
      ? `${quantity}${ingredient.unit}`
      : quantity !== undefined
        ? String(quantity)
        : ingredient.unit || "";

  const macros = `${ingredient.protein}P/${ingredient.carbs}C/${ingredient.fats}F`;
  return [ingredient.name, amount, macros].filter(Boolean).join(" ");
}

export function buildHistoryCsv(entries: MacroEntry[]) {
  const rows = entries.map((entry) => {
    const ingredients = entry.ingredients || [];

    return [
      entry.entryDate || "",
      entry.entryTime || "",
      entry.mealType || "",
      entry.foodName || entry.mealName || "",
      entry.protein,
      entry.carbs,
      entry.fats,
      calculateCalories(entry),
      ingredients.length,
      ingredients.map((ingredient) => ingredient.name).join(" | "),
      ingredients.map(formatIngredient).join(" | "),
      entry.createdAt,
    ]
      .map(escapeCsvValue)
      .join(",");
  });

  return [HISTORY_EXPORT_HEADERS.join(","), ...rows].join("\n");
}

export function downloadHistoryCsv(entries: MacroEntry[]) {
  const csvContent = buildHistoryCsv(entries);
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = globalThis.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `macrotrackr-history-${date}.csv`;
  anchor.style.visibility = "hidden";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  globalThis.URL.revokeObjectURL(url);
}

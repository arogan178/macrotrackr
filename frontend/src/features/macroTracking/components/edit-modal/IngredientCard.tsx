import { motion } from "motion/react";

import type { Ingredient } from "@/types/macro";

interface IngredientCardProps {
  ingredient: Ingredient;
  index: number;
  onUpdateIngredient: (
    index: number,
    field: keyof Ingredient,
    value: string | number | undefined,
  ) => void;
  onRemoveIngredient: (index: number) => void;
}

export default function IngredientCard({
  ingredient,
  index,
  onUpdateIngredient,
  onRemoveIngredient,
}: IngredientCardProps) {
  const calories = Math.round(
    (ingredient.protein || 0) * 4 +
      (ingredient.carbs || 0) * 4 +
      (ingredient.fats || 0) * 9,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group rounded-2xl border border-border/60 bg-surface p-4 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/20 hover:border-border hover:shadow-md"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex-1">
          <label
            htmlFor={`ingredient-name-${index}`}
            className="mb-2 block text-xs font-medium text-muted"
          >
            Ingredient Name
          </label>
          <input
            id={`ingredient-name-${index}`}
            type="text"
            value={ingredient.name}
            onChange={(event_) =>
              onUpdateIngredient(index, "name", event_.target.value)
            }
            placeholder="e.g., Chicken Breast"
            className="w-full rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors placeholder:text-muted/60 focus:bg-surface focus:ring-2 focus:ring-primary/40 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => onRemoveIngredient(index)}
          className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/40 mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted transition-[background-color,border-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:outline-none"
          title="Remove ingredient"
          aria-label={`Remove ${ingredient.name || "ingredient"}`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label
            htmlFor={`ingredient-p-${index}`}
            className="mb-2 flex items-center gap-1 text-xs font-medium"
          >
            <span className="h-2 w-2 rounded-full bg-protein" />
            <span className="text-protein">Protein</span>
          </label>
          <div className="relative">
            <input
              id={`ingredient-p-${index}`}
              type="number"
              inputMode="decimal"
              value={ingredient.protein || ""}
              onChange={(event_) =>
                onUpdateIngredient(
                  index,
                  "protein",
                  event_.target.value === "" ? 0 : Number(event_.target.value),
                )
              }
              placeholder="0"
              min={0}
              step={0.1}
              className="w-full rounded-xl bg-surface-2 py-2.5 pr-8 pl-4 text-right text-sm font-medium text-foreground tabular-nums transition-colors placeholder:text-muted/60 focus:bg-surface focus:ring-2 focus:ring-protein/40 focus:outline-none"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted">
              g
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor={`ingredient-c-${index}`}
            className="mb-2 flex items-center gap-1 text-xs font-medium"
          >
            <span className="h-2 w-2 rounded-full bg-carbs" />
            <span className="text-carbs">Carbs</span>
          </label>
          <div className="relative">
            <input
              id={`ingredient-c-${index}`}
              type="number"
              inputMode="decimal"
              value={ingredient.carbs || ""}
              onChange={(event_) =>
                onUpdateIngredient(
                  index,
                  "carbs",
                  event_.target.value === "" ? 0 : Number(event_.target.value),
                )
              }
              placeholder="0"
              min={0}
              step={0.1}
              className="w-full rounded-xl bg-surface-2 py-2.5 pr-8 pl-4 text-right text-sm font-medium text-foreground tabular-nums transition-colors placeholder:text-muted/60 focus:bg-surface focus:ring-2 focus:ring-carbs/40 focus:outline-none"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted">
              g
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor={`ingredient-f-${index}`}
            className="mb-2 flex items-center gap-1 text-xs font-medium"
          >
            <span className="h-2 w-2 rounded-full bg-fats" />
            <span className="text-fats">Fats</span>
          </label>
          <div className="relative">
            <input
              id={`ingredient-f-${index}`}
              type="number"
              inputMode="decimal"
              value={ingredient.fats || ""}
              onChange={(event_) =>
                onUpdateIngredient(
                  index,
                  "fats",
                  event_.target.value === "" ? 0 : Number(event_.target.value),
                )
              }
              placeholder="0"
              min={0}
              step={0.1}
              className="w-full rounded-xl bg-surface-2 py-2.5 pr-8 pl-4 text-right text-sm font-medium text-foreground tabular-nums transition-colors placeholder:text-muted/60 focus:bg-surface focus:ring-2 focus:ring-fats/40 focus:outline-none"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted">
              g
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-border/40 pt-4 md:grid-cols-[minmax(0,1fr)_112px] md:items-end">
        <div className="flex-1">
          <label
            htmlFor={`ingredient-qty-${index}`}
            className="mb-2 block text-xs font-medium text-muted"
          >
            Quantity
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id={`ingredient-qty-${index}`}
                type="number"
                inputMode="decimal"
                value={ingredient.quantity ?? ""}
                onChange={(event_) =>
                  onUpdateIngredient(
                    index,
                    "quantity",
                    event_.target.value === ""
                      ? undefined
                      : Number(event_.target.value),
                  )
                }
                placeholder="Amount"
                min={0}
                step={0.1}
                className="w-full rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground tabular-nums transition-colors placeholder:text-muted/60 focus:bg-surface focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
            <input
              id={`ingredient-unit-${index}`}
              type="text"
              value={ingredient.unit ?? ""}
              onChange={(event_) =>
                onUpdateIngredient(index, "unit", event_.target.value)
              }
              placeholder="g"
              list={`units-${index}`}
              className="w-20 rounded-xl bg-surface-2 px-3 py-2.5 text-center text-sm font-medium text-foreground transition-colors placeholder:text-muted/60 focus:bg-surface focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
            <datalist id={`units-${index}`}>
              <option value="g" />
              <option value="kg" />
              <option value="oz" />
              <option value="lb" />
              <option value="ml" />
              <option value="L" />
              <option value="cup" />
              <option value="tbsp" />
              <option value="tsp" />
              <option value="pt" />
              <option value="unit" />
            </datalist>
          </div>
        </div>

        <div>
          <div className="mb-2 block text-xs font-medium text-muted">Cals</div>
          <div className="flex h-10.5 items-center justify-end rounded-xl bg-surface-2 px-4 text-right text-base font-semibold text-foreground tabular-nums">
            {calories}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

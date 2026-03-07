import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react";

import type { Ingredient } from "@/types/macro";

import IngredientCard from "./IngredientCard";

interface IngredientsPanelProps {
  ingredients: Ingredient[];
  hasIngredients: boolean;
  showIngredients: boolean;
  scaleFactor: number;
  onToggle: () => void;
  onScale: (value: number) => void;
  onUpdateIngredient: (
    index: number,
    field: keyof Ingredient,
    value: string | number | undefined,
  ) => void;
  onRemoveIngredient: (index: number) => void;
  onAddIngredient: () => void;
}

export default function IngredientsPanel({
  ingredients,
  hasIngredients,
  showIngredients,
  scaleFactor,
  onToggle,
  onScale,
  onUpdateIngredient,
  onRemoveIngredient,
  onAddIngredient,
}: IngredientsPanelProps) {
  return (
    <section className="rounded-3xl border border-border/60 bg-surface/80 p-5 shadow-sm md:p-6">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-surface-2/40"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-2 text-muted transition-colors group-hover:text-foreground">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold text-foreground">
              Ingredients
            </span>
            <span className="block text-[11px] font-medium text-muted">
              Change amount or unit to rescale each ingredient proportionally.
            </span>
          </span>
        </span>
        <div className="flex items-center gap-2">
          {ingredients.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {ingredients.length}
            </span>
          )}
          <motion.div
            animate={{ rotate: showIngredients ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted group-hover:text-foreground"
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {showIngredients && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {hasIngredients && (
                <div className="space-y-2 rounded-2xl border border-border/50 bg-surface-2/60 p-3">
                  <p className="text-xs font-medium text-foreground">
                    Scale all{" "}
                    <span className="text-muted">
                      Adjust every ingredient together.
                    </span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
                    {[0.25, 0.5, 0.75, 1, 1.5, 2].map((factor) => (
                      <button
                        key={factor}
                        type="button"
                        onClick={() => onScale(factor)}
                        className={`rounded-xl px-2.5 py-2 text-center text-xs font-medium transition-[background-color,border-color,color,transform] duration-200 ${
                          Math.abs(scaleFactor - factor) < 0.01
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface hover:bg-surface-2 text-foreground"
                        }`}
                      >
                        {factor === 1 ? "1x" : `${factor}x`}
                      </button>
                    ))}
                    <input
                      type="number"
                      inputMode="decimal"
                      value={scaleFactor || ""}
                      onChange={(event_) =>
                        onScale(Number(event_.target.value) || 1)
                      }
                      placeholder="Custom"
                      min={0.1}
                      max={10}
                      step={0.1}
                      className="col-span-2 rounded-xl border border-border/50 bg-surface px-3 py-2 text-center text-xs font-medium text-foreground tabular-nums placeholder:text-muted/60 focus:ring-2 focus:ring-primary/40 focus:outline-none md:col-span-1"
                    />
                  </div>
                </div>
              )}

              {hasIngredients ? (
                <div className="max-h-115 space-y-3 overflow-y-auto overscroll-contain pr-1">
                  {ingredients.map((ingredient, index) => (
                    <Fragment
                      key={`${ingredient.sourceEntryId ?? "ingredient"}-${index}`}
                    >
                      {ingredient.sourceEntryName &&
                      ingredient.sourceEntryName !==
                        ingredients[index - 1]?.sourceEntryName ? (
                        <div className="sticky top-0 z-10 -mb-1 pt-2">
                          <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-surface-2/95 px-3 py-2 shadow-sm backdrop-blur">
                            <span className="h-px flex-1 bg-border/60" />
                            <span className="shrink-0 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                              {ingredient.sourceEntryName}
                            </span>
                            <span className="h-px flex-1 bg-border/60" />
                          </div>
                        </div>
                      ) : null}
                      <IngredientCard
                        ingredient={ingredient}
                        index={index}
                        onUpdateIngredient={onUpdateIngredient}
                        onRemoveIngredient={onRemoveIngredient}
                      />
                    </Fragment>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-surface-2/20 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface">
                    <svg
                      className="h-6 w-6 text-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No ingredients yet
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Add ingredients to track macros for each component
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onAddIngredient}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-surface-2/30 py-3.5 text-sm font-medium text-foreground transition-[background-color,border-color,color,transform] duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-[0.98]"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Ingredient
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

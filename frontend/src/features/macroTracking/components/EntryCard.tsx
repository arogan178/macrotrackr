import { memo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ChevronDownIcon, IconButtonGroup } from "@/components/ui";
import type { MacroEntry } from "@/types/macro";

interface EntryCardProps {
  entry: MacroEntry;
  onEdit: (entry: MacroEntry) => void;
  deleteEntry: (id: number) => void;
  isDeleting: boolean;
  formatTimeFromEntry: (entry: MacroEntry) => string;
  capitalizeFirstLetter: (string: string) => string;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
  onSaveMeal?: (entry: MacroEntry) => void;
  onUnsaveMeal?: (entry: MacroEntry) => void;
  isMealSaved?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: number) => void;
}

export const EntryCard = memo(
  ({
    entry,
    onEdit,
    deleteEntry,
    isDeleting,
    formatTimeFromEntry,
    capitalizeFirstLetter,
    calculateCalories,
    onSaveMeal,
    onUnsaveMeal,
    isMealSaved,
    isSelectionMode,
    isSelected,
    onToggleSelection,
  }: EntryCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasIngredients = Boolean(
      entry.ingredients && entry.ingredients.length > 1,
    );

    return (
      <motion.div
        className="rounded-card border border-border bg-surface p-3 sm:p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        layout
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {isSelectionMode && (
              <input
                type="checkbox"
                className="h-5 w-5 rounded-control border-border text-primary focus:ring-primary/50"
                checked={isSelected}
                onChange={(event_) => {
                  event_.stopPropagation();
                  onToggleSelection?.(entry.id);
                }}
              />
            )}
            {hasIngredients && (
              <button
                type="button"
                className="cursor-pointer rounded-control p-1 hover:bg-surface-3"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label="Toggle ingredients"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isExpanded ? -180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </motion.div>
              </button>
            )}
            <span className="text-sm font-medium tracking-tight text-foreground">
              {formatTimeFromEntry(entry)}
            </span>
            <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted uppercase">
              {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
            </span>
          </div>
          <IconButtonGroup
            onEdit={() => onEdit(entry)}
            onDelete={() => deleteEntry(entry.id)}
            isDeleting={isDeleting}
            onSaveMeal={onSaveMeal ? () => onSaveMeal(entry) : undefined}
            onUnsaveMeal={onUnsaveMeal ? () => onUnsaveMeal(entry) : undefined}
            isMealSaved={isMealSaved}
          />
        </div>

        {(entry.foodName ?? entry.mealName) && (
          <p className="mb-2 truncate text-sm text-muted">
            {entry.foodName ?? entry.mealName}
          </p>
        )}

        {/* One line of values instead of four bordered boxes: a row was ~200px
            tall, which fit roughly three entries on a phone screen. */}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm tabular-nums">
          <span className="font-medium">
            {calculateCalories(entry.protein, entry.carbs, entry.fats)}
            <span className="ml-1 text-xs text-muted">kcal</span>
          </span>
          <span className="text-protein">
            {entry.protein}
            <span className="ml-0.5 text-xs text-muted">g P</span>
          </span>
          <span className="text-carbs">
            {entry.carbs}
            <span className="ml-0.5 text-xs text-muted">g C</span>
          </span>
          <span className="text-fats">
            {entry.fats}
            <span className="ml-0.5 text-xs text-muted">g F</span>
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && hasIngredients && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                height: { duration: 0.3, ease: "easeInOut" },
                opacity: { duration: 0.2 },
              }}
              className="mt-4 overflow-hidden border-t border-border"
            >
              <div className="pt-4">
                <h4 className="mb-3 text-xs font-semibold text-muted uppercase">
                  Ingredients
                </h4>
                <div className="space-y-3">
                  {entry.ingredients?.map((ing, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-1 rounded-control bg-surface-2 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {ing.name}
                        </span>
                        {ing.quantity && (
                          <span className="text-xs text-muted">
                            {ing.quantity}
                            {ing.unit ?? ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="text-protein">{ing.protein}g P</span>
                        <span className="text-carbs">{ing.carbs}g C</span>
                        <span className="text-fats">{ing.fats}g F</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

EntryCard.displayName = "EntryCard";

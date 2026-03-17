import { memo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { MacroCell } from "@/components/macros";
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
    const hasIngredients = entry.ingredients && entry.ingredients.length > 0;

    return (
      <motion.div
        className="rounded-xl border border-border/60 bg-surface p-5 shadow-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        layout
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSelectionMode && (
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary/50"
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
                className="cursor-pointer rounded-md p-1 hover:bg-surface-3"
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
            <span className="rounded-full border border-border/50 bg-surface-2 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted uppercase">
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
          <div className="mb-3">
            <span className="text-sm text-muted">
              {entry.foodName ?? entry.mealName}
            </span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Protein", value: entry.protein, color: "text-protein", bg: "bg-surface-2" },
            { label: "Carbs", value: entry.carbs, color: "text-carbs", bg: "bg-surface-2" },
            { label: "Fats", value: entry.fats, color: "text-fats", bg: "bg-surface-2" },
          ].map((macro) => (
            <div
              key={macro.label}
              className={`flex flex-col items-center justify-center rounded-xl ${macro.bg} border border-border/40 p-3`}
            >
              <span className="mb-1 text-[10px] tracking-wider text-muted uppercase">
                {macro.label}
              </span>
              <MacroCell value={macro.value} suffix="g" color={macro.color} />
            </div>
          ))}
          <div className="col-span-3 mt-1 flex items-center justify-between rounded-xl border border-border/40 bg-surface-2 p-3.5">
            <span className="text-xs font-medium tracking-wider text-muted uppercase">
              Calories
            </span>
            <MacroCell
              value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
              suffix=" kcal"
              color="text-foreground"
            />
          </div>
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
              className="mt-4 overflow-hidden border-t border-border/40"
            >
              <div className="pt-4">
                <h4 className="mb-3 text-xs font-semibold text-muted uppercase">
                  Ingredients
                </h4>
                <div className="space-y-3">
                  {entry.ingredients?.map((ing, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-1 rounded-lg bg-surface-2/50 p-3"
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

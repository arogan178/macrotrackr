import { memo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ChevronDownIcon, StarIcon } from "@/components/ui";
import Value from "@/components/ui/Value";
import { DURATIONS, EASINGS } from "@/components/utils/UiConstants";
import type { MacroEntry } from "@/types/macro";

import { MacroSplitBar } from "./MacroSplitBar";
import { PendingSyncMarker } from "./PendingSyncMarker";

interface EntryCardProps {
  entry: MacroEntry;
  formatTimeFromEntry: (entry: MacroEntry) => string;
  capitalizeFirstLetter: (string: string) => string;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
  /** Opens the entry's actions. The row itself is the only control. */
  onOpen: (entry: MacroEntry) => void;
  isDeleting?: boolean;
  isMealSaved?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export const EntryCard = memo(
  ({
    entry,
    formatTimeFromEntry,
    capitalizeFirstLetter,
    calculateCalories,
    onOpen,
    isDeleting,
    isMealSaved,
    isSelectionMode,
    isSelected,
    onToggleSelection,
  }: EntryCardProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasIngredients = Boolean(
      entry.ingredients && entry.ingredients.length > 1,
    );
    const name = entry.foodName ?? entry.mealName;
    const mealType = entry.mealType ? capitalizeFirstLetter(entry.mealType) : "";

    // No enter animation and no `layout`: these rows are virtualized, so motion
    // projection would re-measure rows the virtualizer had already measured.
    //
    // One tap target per row. Five icon buttons per entry made the list a wall
    // of controls; the actions now live in the sheet the row opens.
    return (
      <div className={isDeleting ? "opacity-50" : undefined}>
        <div className="flex items-stretch gap-1 px-4">
          {isSelectionMode && (
            <input
              type="checkbox"
              aria-label={`Select ${name ?? mealType}`}
              className="h-5 w-5 self-center rounded-control border-border accent-primary"
              checked={isSelected}
              onChange={() => onToggleSelection?.(entry.clientId)}
            />
          )}
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col gap-1.5 py-3 text-left"
            onClick={() =>
              isSelectionMode ? onToggleSelection?.(entry.clientId) : onOpen(entry)
            }
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-foreground">
                {name ?? mealType}
              </span>
              <Value
                value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
                unit="kcal"
                className="shrink-0"
              />
            </span>
            <span className="flex items-center gap-2 text-xs text-muted">
              <MacroSplitBar
                protein={entry.protein}
                carbs={entry.carbs}
                fats={entry.fats}
                className="order-last ml-auto w-12"
              />
              <span className="tabular-nums">{formatTimeFromEntry(entry)}</span>
              {name ? <span>{mealType}</span> : null}
              {isMealSaved && (
                <StarIcon
                  aria-label="Saved meal"
                  className="h-3 w-3 fill-current text-primary"
                />
              )}
              <PendingSyncMarker entry={entry} />
            </span>
          </button>
          {hasIngredients && (
            <button
              type="button"
              className="flex w-11 shrink-0 items-center justify-center text-muted hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label="Show ingredients"
            >
              <motion.span
                initial={false}
                animate={{ rotate: isExpanded ? -180 : 0 }}
                transition={{ duration: DURATIONS.instant }}
              >
                <ChevronDownIcon className="h-4 w-4" />
              </motion.span>
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && hasIngredients && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                height: { duration: DURATIONS.base, ease: EASINGS.out },
                opacity: { duration: DURATIONS.base },
              }}
              className="overflow-hidden px-4 pb-3"
            >
              <div>
                <div className="divide-y divide-border border-l-2 border-border pl-3">
                  {entry.ingredients?.map((ing, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-1 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
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
      </div>
    );
  },
);

EntryCard.displayName = "EntryCard";

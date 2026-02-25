import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import { memo, useMemo, useRef } from "react";

import { MacroCell } from "@/components/macros";
import { ChevronDownIcon, IconButton, IconButtonGroup } from "@/components/ui";
import { MacroEntry } from "@/types/macro";

interface GroupedEntry {
  date: string;
  entries: MacroEntry[];
  totals: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
}

interface MobileEntryCardsProps {
  groupedEntries: GroupedEntry[];
  collapsedDates: Set<string>;
  formatDate: (dateString: string) => string;
  formatTimeFromEntry: (entry: MacroEntry) => string;
  capitalizeFirstLetter: (string: string) => string;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
  toggleDateCollapse: (date: string) => void;
  handleDeleteDate: (date: string, event: React.MouseEvent) => void;
  onEdit: (entry: MacroEntry) => void;
  deleteEntry: (id: number) => void;
  isDeleting: boolean;
  showAllDates?: boolean;
}

const EntryCard = memo(
  ({
    entry,
    onEdit,
    deleteEntry,
    isDeleting,
    formatTimeFromEntry,
    capitalizeFirstLetter,
    calculateCalories,
  }: {
    entry: MacroEntry;
    onEdit: (entry: MacroEntry) => void;
    deleteEntry: (id: number) => void;
    isDeleting: boolean;
    formatTimeFromEntry: (entry: MacroEntry) => string;
    capitalizeFirstLetter: (string: string) => string;
    calculateCalories: (protein: number, carbs: number, fats: number) => number;
  }) => (
    <motion.div
      className="rounded-xl border border-border/60 bg-surface p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(255,255,255,0.01)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      layout
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        />
      </div>

      {(entry.foodName || entry.mealName) && (
        <div className="mb-3">
          <span className="text-sm text-muted">
            {entry.foodName || entry.mealName}
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
            <span className="mb-1 text-[10px] tracking-wider text-muted uppercase">{macro.label}</span>
            <MacroCell value={macro.value} suffix="g" color={macro.color} />
          </div>
        ))}
        <div className="col-span-3 mt-1 flex items-center justify-between rounded-xl border border-border/40 bg-surface-2 p-3.5">
          <span className="text-xs font-medium tracking-wider text-muted uppercase">Calories</span>
          <MacroCell
            value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
            suffix=" kcal"
            color="text-foreground"
          />
        </div>
      </div>
    </motion.div>
  ),
);

EntryCard.displayName = "EntryCard";

const MobileEntryCards = memo(
  ({
    groupedEntries,
    collapsedDates,
    formatDate,
    formatTimeFromEntry,
    capitalizeFirstLetter,
    calculateCalories,
    toggleDateCollapse,
    handleDeleteDate,
    onEdit,
    deleteEntry,
    isDeleting,
    showAllDates = true,
  }: MobileEntryCardsProps) => {
    const containerReference = useRef<HTMLDivElement>(null);

    const totalEntries = useMemo(() => {
      return groupedEntries.reduce(
        (sum, group) => sum + group.entries.length,
        0,
      );
    }, [groupedEntries]);

    const shouldVirtualize = totalEntries > 50;

    const virtualItems = useMemo(() => {
      const items: Array<
        | { type: "header"; group: GroupedEntry }
        | { type: "entry"; entry: MacroEntry; groupDate: string }
      > = [];

      const entriesToProcess = showAllDates
        ? groupedEntries
        : groupedEntries.slice(0, 5);

      for (const group of entriesToProcess) {
        items.push({ type: "header", group });
        if (!collapsedDates.has(group.date)) {
          for (const entry of group.entries) {
            items.push({ type: "entry", entry, groupDate: group.date });
          }
        }
      }

      return items;
    }, [groupedEntries, showAllDates, collapsedDates]);

    const virtualizer = useVirtualizer({
      count: virtualItems.length,
      getScrollElement: () => containerReference.current,
      estimateSize: (index) => {
        const item = virtualItems[index];
        if (item.type === "header") return 60;
        return 200;
      },
      overscan: 5,
    });

    const renderDateHeader = (group: GroupedEntry) => (
      <motion.div
        className="flex cursor-pointer items-center justify-between border-b border-border/40 bg-surface-2/30 p-4 transition-all duration-300 hover:bg-surface-2/60"
        onClick={() => toggleDateCollapse(group.date)}
        whileHover={{ backgroundColor: "var(--color-surface-2)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              rotate: collapsedDates.has(group.date) ? -90 : 0,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChevronDownIcon className=" text-foreground" />
          </motion.div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {formatDate(group.date)}
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium tracking-tight text-protein">
            {group.totals.protein}g P
          </span>
          <span className="font-medium tracking-tight text-carbs">
            {group.totals.carbs}g C
          </span>
          <span className="font-medium tracking-tight text-fats">{group.totals.fats}g F</span>
          <span className="font-medium tracking-tight text-foreground">
            {group.totals.calories} kcal
          </span>
          <IconButton
            variant="delete"
            onClick={(event) => handleDeleteDate(group.date, event)}
            ariaLabel={`Delete all entries for ${formatDate(group.date)}`}
          />
        </div>
      </motion.div>
    );

    if (shouldVirtualize) {
      const items = virtualizer.getVirtualItems();

      return (
        <div
          ref={containerReference}
          className="max-h-[70vh] overflow-auto lg:hidden"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {items.map((virtualRow) => {
              const item = virtualItems[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.type === "header" ? (
                    <div className="border-b border-border/40">
                      {renderDateHeader(item.group)}
                    </div>
                  ) : (
                    <div className="p-4 pt-0">
                      <EntryCard
                        entry={item.entry}
                        onEdit={onEdit}
                        deleteEntry={deleteEntry}
                        isDeleting={isDeleting}
                        formatTimeFromEntry={formatTimeFromEntry}
                        capitalizeFirstLetter={capitalizeFirstLetter}
                        calculateCalories={calculateCalories}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const initialEntries = groupedEntries.slice(0, 5);
    const additionalEntries = groupedEntries.slice(5);

    return (
      <div className="lg:hidden">
        {initialEntries.map((group) => (
          <motion.div
            key={group.date}
            className="border-b border-border/40 last:border-b-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderDateHeader(group)}

            <AnimatePresence>
              {!collapsedDates.has(group.date) && (
                <motion.div
                  className="overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    transition: {
                      height: { duration: 0.4, ease: "easeInOut" },
                      opacity: { duration: 0.2, delay: 0.1 },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: { duration: 0.3, ease: "easeInOut" },
                      opacity: { duration: 0.1 },
                    },
                  }}
                >
                  <div className="space-y-3 p-4">
                    {group.entries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                      >
                        <EntryCard
                          entry={entry}
                          onEdit={onEdit}
                          deleteEntry={deleteEntry}
                          isDeleting={isDeleting}
                          formatTimeFromEntry={formatTimeFromEntry}
                          capitalizeFirstLetter={capitalizeFirstLetter}
                          calculateCalories={calculateCalories}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        <AnimatePresence>
          {showAllDates &&
            additionalEntries.map((group) => (
              <motion.div
                key={group.date}
                className="border-b border-border/40 last:border-b-0"
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  transition: {
                    height: { duration: 0.4, ease: "easeInOut" },
                    opacity: { duration: 0.3, delay: 0.1 },
                  },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: {
                    height: { duration: 0.3, ease: "easeInOut" },
                    opacity: { duration: 0.2 },
                  },
                }}
                style={{ overflow: "hidden" }}
              >
                {renderDateHeader(group)}

                <AnimatePresence>
                  {!collapsedDates.has(group.date) && (
                    <motion.div
                      className="overflow-hidden"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                          height: { duration: 0.4, ease: "easeInOut" },
                          opacity: { duration: 0.2, delay: 0.1 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.3, ease: "easeInOut" },
                          opacity: { duration: 0.1 },
                        },
                      }}
                    >
                      <div className="space-y-3 p-4">
                        {group.entries.map((entry, index) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: index * 0.05,
                              duration: 0.3,
                              ease: "easeOut",
                            }}
                          >
                            <EntryCard
                              entry={entry}
                              onEdit={onEdit}
                              deleteEntry={deleteEntry}
                              isDeleting={isDeleting}
                              formatTimeFromEntry={formatTimeFromEntry}
                              capitalizeFirstLetter={capitalizeFirstLetter}
                              calculateCalories={calculateCalories}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    );
  },
);

MobileEntryCards.displayName = "MobileEntryCards";

export default MobileEntryCards;

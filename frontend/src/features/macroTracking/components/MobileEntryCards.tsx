import { memo, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";

import { ChevronDownIcon, IconButton } from "@/components/ui";
import type { MacroEntry } from "@/types/macro";

import { EntryCard } from "./EntryCard";
import { useEntryHistoryController } from "./EntryHistoryContext";
import type {
  GroupedEntry,
} from "./EntryHistoryShared";

interface MobileEntryCardsProps {
  groupedEntries: GroupedEntry[];
}

const MobileEntryCards = memo(
  ({ groupedEntries }: MobileEntryCardsProps) => {
    const controller = useEntryHistoryController();
    const {
      formatDate,
      formatTimeFromEntry,
      capitalizeFirstLetter,
      calculateCalories,
      isDateCollapsed,
      toggleDateCollapse,
      handleDeleteDate,
      onEdit,
      deleteEntry,
      onSaveMeal,
      onUnsaveMeal,
      isMealSaved,
      isDeleting,
      isSelectionMode,
      isEntrySelected,
      onToggleEntrySelection,
    } = controller;

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
        | { type: "entry"; entry: MacroEntry }
      > = [];

      for (const group of groupedEntries) {
        items.push({ type: "header", group });
        if (!isDateCollapsed(group.date)) {
          for (const entry of group.entries) {
            items.push({ type: "entry", entry });
          }
        }
      }

      return items;
    }, [groupedEntries, isDateCollapsed]);

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
        className="flex cursor-pointer items-center justify-between border-b border-border/40 bg-surface-2/30 p-4 transition-colors duration-300 hover:bg-surface-2/60"
        onClick={() => toggleDateCollapse(group.date)}
        whileHover={{ backgroundColor: "var(--color-surface-2)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              rotate: isDateCollapsed(group.date) ? -90 : 0,
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
          <span className="font-medium tracking-tight text-fats">
            {group.totals.fats}g F
          </span>
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

    const renderEntryCard = (entry: MacroEntry, index?: number) => {
      const card = (
        <EntryCard
          entry={entry}
          onEdit={onEdit}
          deleteEntry={deleteEntry}
          isDeleting={isDeleting}
          formatTimeFromEntry={formatTimeFromEntry}
          capitalizeFirstLetter={capitalizeFirstLetter}
          calculateCalories={calculateCalories}
          onSaveMeal={onSaveMeal}
          onUnsaveMeal={onUnsaveMeal}
          isMealSaved={isMealSaved(entry.id)}
          isSelectionMode={isSelectionMode}
          isSelected={isEntrySelected(entry.id)}
          onToggleSelection={onToggleEntrySelection}
        />
      );

      if (typeof index !== "number") {
        return card;
      }

      return (
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
          {card}
        </motion.div>
      );
    };

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
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.type === "header" ? (
                    <div className="border-b border-border/40">
                      {renderDateHeader(item.group)}
                    </div>
                  ) : (
                    <div className="p-4 pt-0">
                      {renderEntryCard(item.entry)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="lg:hidden">
        <AnimatePresence>
          {groupedEntries.map((group) => (
            <motion.div
              key={group.date}
              className="border-b border-border/40 last:border-b-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderDateHeader(group)}

              <AnimatePresence>
                {!isDateCollapsed(group.date) && (
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
                      {group.entries.map((entry, index) =>
                        renderEntryCard(entry, index),
                      )}
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

import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";

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

// Entry Card Component
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
      className="rounded-lg bg-surface p-4 "
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
      whileHover={{ scale: 1.02 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {formatTimeFromEntry(entry)}
          </span>
          <span className="text-sm font-medium text-foreground">
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
        <motion.div
          className="mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="text-sm text-foreground">
            {entry.foodName || entry.mealName}
          </span>
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, staggerChildren: 0.05 }}
      >
        {[
          { label: "Protein", value: entry.protein, color: "text-protein" },
          { label: "Carbs", value: entry.carbs, color: "text-carbs" },
          { label: "Fats", value: entry.fats, color: "text-fats" },
        ].map((macro, index) => (
          <motion.div
            key={macro.label}
            className="flex items-center justify-between rounded-lg bg-surface/50 p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm text-foreground">{macro.label}</span>
            <MacroCell value={macro.value} suffix="g" color={macro.color} />
          </motion.div>
        ))}
        <motion.div
          className="col-span-3 flex items-center justify-between rounded-lg bg-surface/50 p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-sm text-foreground">Calories</span>
          <MacroCell
            value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
            suffix=" kcal"
            color="text-vibrant-accent"
          />
        </motion.div>
      </motion.div>
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
    const initialEntries = groupedEntries.slice(0, 5);
    const additionalEntries = groupedEntries.slice(5);

    return (
      <div className="lg:hidden">
        {/* Initial 5 entries */}
        {initialEntries.map((group) => (
          <motion.div
            key={group.date}
            className="border-b border-border/30 last:border-b-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Date Header */}
            <motion.div
              className="flex cursor-pointer items-center justify-between border-b border-primary/20 bg-primary/10 p-4 transition-colors hover:bg-primary/20"
              onClick={() => toggleDateCollapse(group.date)}
              whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.15)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: collapsedDates.has(group.date) ? -90 : 0,
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <ChevronDownIcon className="h-5 w-5 text-foreground" />
                </motion.div>
                <h3 className="text-base font-semibold text-foreground">
                  {formatDate(group.date)}
                </h3>
              </div>

              {/* Date Totals */}
              <div className="flex items-center gap-4 text-xs">
                <span className="font-medium text-protein">
                  {group.totals.protein}g P
                </span>
                <span className="font-medium text-carbs">
                  {group.totals.carbs}g C
                </span>
                <span className="font-medium text-fats">
                  {group.totals.fats}g F
                </span>
                <span className="font-medium text-vibrant-accent">
                  {group.totals.calories} kcal
                </span>
                <IconButton
                  variant="delete"
                  onClick={(event) => handleDeleteDate(group.date, event)}
                  ariaLabel={`Delete all entries for ${formatDate(group.date)}`}
                />
              </div>
            </motion.div>

            {/* Entries */}
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

        {/* Additional entries with animation */}
        <AnimatePresence>
          {showAllDates &&
            additionalEntries.map((group) => (
              <motion.div
                key={group.date}
                className="border-b border-border/30 last:border-b-0"
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
                {/* Date Header */}
                <motion.div
                  className="flex cursor-pointer items-center justify-between border-b border-primary/20 bg-primary/10 p-4 transition-colors hover:bg-primary/20"
                  onClick={() => toggleDateCollapse(group.date)}
                  whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.15)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      key={`chevron-${group.date}`}
                      initial={false}
                      animate={{
                        rotate: collapsedDates.has(group.date) ? -90 : 0,
                      }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <ChevronDownIcon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h3 className="text-base font-semibold text-primary">
                      {formatDate(group.date)}
                    </h3>
                  </div>

                  {/* Date Totals */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-medium text-protein">
                      {group.totals.protein}g P
                    </span>
                    <span className="font-medium text-carbs">
                      {group.totals.carbs}g C
                    </span>
                    <span className="font-medium text-fats">
                      {group.totals.fats}g F
                    </span>
                    <span className="font-medium text-vibrant-accent">
                      {group.totals.calories} kcal
                    </span>
                    <IconButton
                      variant="delete"
                      onClick={(event) => handleDeleteDate(group.date, event)}
                      ariaLabel={`Delete all entries for ${formatDate(
                        group.date,
                      )}`}
                    />
                  </div>
                </motion.div>

                {/* Entries */}
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

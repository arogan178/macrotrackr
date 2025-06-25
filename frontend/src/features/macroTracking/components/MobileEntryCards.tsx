import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDownIcon, TrashIcon } from "@/components/Icons";
import { MacroCell } from "@/components/nutrition";
import { ActionButtonGroup } from "@/components/form";
import { MacroEntry } from "../types";

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
  handleDeleteDate: (date: string, e: React.MouseEvent) => void;
  onEdit: (entry: MacroEntry) => void;
  deleteEntry: (id: number) => void;
  isDeleting: boolean;
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
      className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm font-medium">
            {formatTimeFromEntry(entry)}
          </span>
          <span className="text-indigo-300 font-medium text-sm">
            {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
          </span>
        </div>
        <ActionButtonGroup
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
          <span className="text-gray-400 text-sm">
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
          { label: "Protein", value: entry.protein, color: "text-green-400" },
          { label: "Carbs", value: entry.carbs, color: "text-blue-400" },
          { label: "Fats", value: entry.fats, color: "text-red-400" },
        ].map((macro, index) => (
          <motion.div
            key={macro.label}
            className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-gray-400 text-sm">{macro.label}</span>
            <MacroCell value={macro.value} suffix="g" color={macro.color} />
          </motion.div>
        ))}
        <motion.div
          className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 col-span-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-gray-400 text-sm">Calories</span>
          <MacroCell
            value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
            suffix=" kcal"
            color="text-white"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
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
  }: MobileEntryCardsProps) => {
    return (
      <div className="lg:hidden">
        {groupedEntries.map((group) => (
          <motion.div
            key={group.date}
            className="border-b border-gray-700/30 last:border-b-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Date Header */}
            <motion.div
              className="flex items-center justify-between p-4 bg-indigo-600/10 border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors"
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
                  <ChevronDownIcon className="w-5 h-5 text-indigo-300" />
                </motion.div>
                <h3 className="font-semibold text-indigo-300 text-base">
                  {formatDate(group.date)}
                </h3>
              </div>

              {/* Date Totals */}
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-400 font-medium">
                  {group.totals.protein}g P
                </span>
                <span className="text-blue-400 font-medium">
                  {group.totals.carbs}g C
                </span>
                <span className="text-red-400 font-medium">
                  {group.totals.fats}g F
                </span>
                <span className="text-white font-medium">
                  {group.totals.calories} kcal
                </span>
                <button
                  onClick={(e) => handleDeleteDate(group.date, e)}
                  className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors"
                  aria-label={`Delete all entries for ${formatDate(
                    group.date
                  )}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
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
      </div>
    );
  }
);

MobileEntryCards.displayName = "MobileEntryCards";

export default MobileEntryCards;

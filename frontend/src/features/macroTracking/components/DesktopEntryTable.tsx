import { memo, Fragment } from "react";
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

interface DesktopEntryTableProps {
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
  showAllDates?: boolean;
}

const TableHeader = memo(
  ({ label, color }: { label: string; color?: string }) => (
    <th
      className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50"
      style={{ width: "14.285%" }}
    >
      {color ? (
        <div className="flex items-center justify-center gap-1">
          <div className={`w-2 h-2 ${color} rounded-full`}></div>
          {label}
        </div>
      ) : (
        label
      )}
    </th>
  )
);

// Reusable Date Header Row Component
const DateHeaderRow = memo(
  ({
    group,
    collapsedDates,
    formatDate,
    toggleDateCollapse,
    handleDeleteDate,
  }: {
    group: GroupedEntry;
    collapsedDates: Set<string>;
    formatDate: (dateString: string) => string;
    toggleDateCollapse: (date: string) => void;
    handleDeleteDate: (date: string, e: React.MouseEvent) => void;
  }) => (
    <motion.tr
      className="bg-indigo-600/10 border-t border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors group"
      onClick={() => toggleDateCollapse(group.date)}
      whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.15)" }}
      transition={{ duration: 0.2 }}
    >
      <td
        className="px-4 py-2.5 font-semibold text-indigo-300 text-sm"
        style={{ width: "14.285%" }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: collapsedDates.has(group.date) ? -90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </motion.div>
          {formatDate(group.date)}
        </div>
      </td>
      <td className="px-4 py-2.5" style={{ width: "14.285%" }}></td>
      <td className="px-4 py-2.5 text-center" style={{ width: "14.285%" }}>
        <MacroCell
          value={group.totals.protein}
          suffix="g"
          color="text-green-400"
        />
      </td>
      <td className="px-4 py-2.5 text-center" style={{ width: "14.285%" }}>
        <MacroCell
          value={group.totals.carbs}
          suffix="g"
          color="text-blue-400"
        />
      </td>
      <td className="px-4 py-2.5 text-center" style={{ width: "14.285%" }}>
        <MacroCell value={group.totals.fats} suffix="g" color="text-red-400" />
      </td>
      <td className="px-4 py-2.5 text-center" style={{ width: "14.285%" }}>
        <MacroCell
          value={group.totals.calories}
          suffix=" kcal"
          color="text-white"
        />
      </td>
      <td className="px-4 py-2.5 text-center" style={{ width: "14.285%" }}>
        <button
          onClick={(e) => handleDeleteDate(group.date, e)}
          className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          aria-label={`Delete all entries for ${formatDate(group.date)}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </td>
    </motion.tr>
  )
);

// Reusable Entry Row Component
const EntryRow = memo(
  ({
    entry,
    index,
    formatTimeFromEntry,
    capitalizeFirstLetter,
    calculateCalories,
    onEdit,
    deleteEntry,
    isDeleting,
  }: {
    entry: MacroEntry;
    index: number;
    formatTimeFromEntry: (entry: MacroEntry) => string;
    capitalizeFirstLetter: (string: string) => string;
    calculateCalories: (protein: number, carbs: number, fats: number) => number;
    onEdit: (entry: MacroEntry) => void;
    deleteEntry: (id: number) => void;
    isDeleting: boolean;
  }) => (
    <motion.div
      key={entry.id}
      className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors grid grid-cols-7 items-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
    >
      <div className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap pl-11">
        {formatTimeFromEntry(entry)}
      </div>
      <div className="px-4 py-3 text-sm text-gray-300 text-center">
        <div>
          <span className="font-medium text-indigo-300">
            {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
          </span>
          {(entry.foodName || entry.mealName) && (
            <span className="text-gray-400 block text-xs mt-0.5">
              {entry.foodName || entry.mealName}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-3 text-center">
        <MacroCell value={entry.protein} suffix="g" color="text-green-400" />
      </div>
      <div className="px-4 py-3 text-center">
        <MacroCell value={entry.carbs} suffix="g" color="text-blue-400" />
      </div>
      <div className="px-4 py-3 text-center">
        <MacroCell value={entry.fats} suffix="g" color="text-red-400" />
      </div>
      <div className="px-4 py-3 text-center">
        <MacroCell
          value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
          suffix=" kcal"
          color="text-white"
        />
      </div>
      <div className="px-4 py-3 text-center whitespace-nowrap">
        <ActionButtonGroup
          onEdit={() => onEdit(entry)}
          onDelete={() => deleteEntry(entry.id)}
          isDeleting={isDeleting}
        />
      </div>
    </motion.div>
  )
);

// Reusable Date Group Component for table context
const DateGroup = memo(
  ({
    group,
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
  }: {
    group: GroupedEntry;
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
  }) => (
    <Fragment key={group.date}>
      <DateHeaderRow
        group={group}
        collapsedDates={collapsedDates}
        formatDate={formatDate}
        toggleDateCollapse={toggleDateCollapse}
        handleDeleteDate={handleDeleteDate}
      />
      <AnimatePresence>
        {!collapsedDates.has(group.date) && (
          <motion.tr
            key={`entries-${group.date}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <td colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div>
                  {group.entries.map((entry, index) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      index={index}
                      formatTimeFromEntry={formatTimeFromEntry}
                      capitalizeFirstLetter={capitalizeFirstLetter}
                      calculateCalories={calculateCalories}
                      onEdit={onEdit}
                      deleteEntry={deleteEntry}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </Fragment>
  )
);

// Simple Date Group for non-table context (additional entries)
const SimpleDateGroup = memo(
  ({
    group,
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
  }: {
    group: GroupedEntry;
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
  }) => (
    <div className="border-b border-gray-700/30 last:border-b-0">
      {/* Date Header */}
      <div
        className="bg-indigo-600/10 border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors grid grid-cols-7 items-center group"
        onClick={() => toggleDateCollapse(group.date)}
      >
        <div className="px-4 py-2.5 font-semibold text-indigo-300 text-sm">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: collapsedDates.has(group.date) ? -90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronDownIcon className="w-4 h-4 text-indigo-300" />
            </motion.div>
            {formatDate(group.date)}
          </div>
        </div>
        <div className="px-4 py-2.5"></div>
        <div className="px-4 py-2.5 text-center">
          <MacroCell
            value={group.totals.protein}
            suffix="g"
            color="text-green-400"
          />
        </div>
        <div className="px-4 py-2.5 text-center">
          <MacroCell
            value={group.totals.carbs}
            suffix="g"
            color="text-blue-400"
          />
        </div>
        <div className="px-4 py-2.5 text-center">
          <MacroCell
            value={group.totals.fats}
            suffix="g"
            color="text-red-400"
          />
        </div>
        <div className="px-4 py-2.5 text-center">
          <MacroCell
            value={group.totals.calories}
            suffix=" kcal"
            color="text-white"
          />
        </div>
        <div className="px-4 py-2.5 text-center">
          <button
            onClick={(e) => handleDeleteDate(group.date, e)}
            className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            aria-label={`Delete all entries for ${formatDate(group.date)}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entries */}
      <AnimatePresence>
        {!collapsedDates.has(group.date) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {group.entries.map((entry, index) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                index={index}
                formatTimeFromEntry={formatTimeFromEntry}
                capitalizeFirstLetter={capitalizeFirstLetter}
                calculateCalories={calculateCalories}
                onEdit={onEdit}
                deleteEntry={deleteEntry}
                isDeleting={isDeleting}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
);

DateHeaderRow.displayName = "DateHeaderRow";
EntryRow.displayName = "EntryRow";
DateGroup.displayName = "DateGroup";
SimpleDateGroup.displayName = "SimpleDateGroup";

const DesktopEntryTable = memo(
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
  }: DesktopEntryTableProps) => {
    const visibleEntries = showAllDates
      ? groupedEntries
      : groupedEntries.slice(0, 5);
    const additionalEntries = groupedEntries.slice(5);

    const sharedProps = {
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
    };

    return (
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-layout: fixed;">
          <thead>
            <tr>
              <TableHeader label="Time" />
              <TableHeader label="Meal" />
              <TableHeader label="Protein" color="bg-green-500" />
              <TableHeader label="Carbs" color="bg-blue-500" />
              <TableHeader label="Fats" color="bg-red-500" />
              <TableHeader label="Calories" />
              <TableHeader label="Actions" />
            </tr>
          </thead>
          <tbody>
            {/* Initial entries */}
            {visibleEntries.slice(0, 5).map((group) => (
              <DateGroup key={group.date} group={group} {...sharedProps} />
            ))}

            {/* Additional entries with animation */}
            <AnimatePresence>
              {showAllDates && additionalEntries.length > 0 && (
                <motion.tr
                  key="additional-entries"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <td colSpan={7} className="p-0">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden bg-gray-800/20"
                    >
                      {additionalEntries.map((group, index) => (
                        <motion.div
                          key={group.date}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                        >
                          <SimpleDateGroup group={group} {...sharedProps} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    );
  }
);

DesktopEntryTable.displayName = "DesktopEntryTable";

export default DesktopEntryTable;

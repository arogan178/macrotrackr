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
}

const TableHeader = memo(
  ({ label, color }: { label: string; color?: string }) => (
    <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
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
  }: DesktopEntryTableProps) => {
    return (
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed">
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
            {groupedEntries.map((group) => (
              <Fragment key={group.date}>
                <motion.tr
                  className="bg-indigo-600/10 border-t border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors group"
                  onClick={() => toggleDateCollapse(group.date)}
                  whileHover={{
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <td className="px-4 py-2.5 font-semibold text-indigo-300 text-sm">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{
                          rotate: collapsedDates.has(group.date) ? -90 : 0,
                        }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <ChevronDownIcon className="w-4 h-4" />
                      </motion.div>
                      {formatDate(group.date)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-green-400">
                    {group.totals.protein}g
                  </td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-blue-400">
                    {group.totals.carbs}g
                  </td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-red-400">
                    {group.totals.fats}g
                  </td>
                  <td className="px-4 py-2.5 text-center text-sm font-semibold text-white">
                    {group.totals.calories} kcal
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={(e) => handleDeleteDate(group.date, e)}
                      className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Delete all entries for ${formatDate(
                        group.date
                      )}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
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
                          <table className="w-full">
                            <tbody>
                              {group.entries.map((entry, index) => (
                                <motion.tr
                                  key={entry.id}
                                  className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    delay: index * 0.05,
                                    duration: 0.3,
                                    ease: "easeOut",
                                  }}
                                >
                                  <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap pl-11">
                                    {formatTimeFromEntry(entry)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-300 text-center">
                                    <div>
                                      <span className="font-medium text-indigo-300">
                                        {entry.mealType
                                          ? capitalizeFirstLetter(
                                              entry.mealType
                                            )
                                          : ""}
                                      </span>
                                      {(entry.foodName || entry.mealName) && (
                                        <span className="text-gray-400 block text-xs mt-0.5">
                                          {entry.foodName || entry.mealName}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-medium text-green-400">
                                    <MacroCell
                                      value={entry.protein}
                                      suffix="g"
                                      color="text-green-400"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-medium text-blue-400">
                                    <MacroCell
                                      value={entry.carbs}
                                      suffix="g"
                                      color="text-blue-400"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm font-medium text-red-400">
                                    <MacroCell
                                      value={entry.fats}
                                      suffix="g"
                                      color="text-red-400"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center font-medium text-white">
                                    <MacroCell
                                      value={calculateCalories(
                                        entry.protein,
                                        entry.carbs,
                                        entry.fats
                                      )}
                                      suffix=" kcal"
                                      color="text-white"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center whitespace-nowrap">
                                    <ActionButtonGroup
                                      onEdit={() => onEdit(entry)}
                                      onDelete={() => deleteEntry(entry.id)}
                                      isDeleting={isDeleting}
                                    />
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </motion.div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

DesktopEntryTable.displayName = "DesktopEntryTable";

export default DesktopEntryTable;

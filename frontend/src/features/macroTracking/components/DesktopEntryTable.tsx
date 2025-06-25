import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { ChevronDownIcon, TrashIcon } from "@/components/Icons";
import { MacroCell } from "@/components/nutrition";
import { ActionButtonGroup } from "@/components/form";
import { MacroEntry } from "../types";

// Types
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

// Combined type for table rows - can be either a date group or individual entry
type TableRowData = GroupedEntry & {
  isGroup: boolean;
  parentDate?: string;
};

const columnHelper = createColumnHelper<TableRowData>();

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
    // Transform data for TanStack Table
    const tableData = useMemo(() => {
      const visibleEntries = showAllDates
        ? groupedEntries
        : groupedEntries.slice(0, 5);
      const additionalEntries = groupedEntries.slice(5);

      const initialData: TableRowData[] = visibleEntries.flatMap((group) => [
        { ...group, isGroup: true },
        ...(!collapsedDates.has(group.date)
          ? group.entries.map((entry) => ({
              ...group,
              isGroup: false,
              entries: [entry], // Wrap single entry for consistency
              parentDate: group.date,
            }))
          : []),
      ]);

      if (showAllDates && additionalEntries.length > 0) {
        const additionalData: TableRowData[] = additionalEntries.flatMap(
          (group) => [
            { ...group, isGroup: true },
            ...(!collapsedDates.has(group.date)
              ? group.entries.map((entry) => ({
                  ...group,
                  isGroup: false,
                  entries: [entry],
                  parentDate: group.date,
                }))
              : []),
          ]
        );
        return [...initialData, ...additionalData];
      }

      return initialData;
    }, [groupedEntries, collapsedDates, showAllDates]);

    // Define columns
    const columns = useMemo(
      () => [
        columnHelper.accessor("date", {
          header: "Time",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) {
              return (
                <div className="flex items-center gap-2 font-semibold text-indigo-300 text-sm">
                  <motion.div
                    animate={{
                      rotate: collapsedDates.has(data.date) ? -90 : 0,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.div>
                  {formatDate(data.date)}
                </div>
              );
            } else {
              const entry = data.entries[0];
              return (
                <div className="pl-11 text-sm text-gray-300 whitespace-nowrap">
                  {formatTimeFromEntry(entry)}
                </div>
              );
            }
          },
        }),
        columnHelper.accessor("entries", {
          header: "Meal",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) return null;

            const entry = data.entries[0];
            return (
              <div className="text-sm text-gray-300 text-center">
                <span className="font-medium text-indigo-300">
                  {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
                </span>
                {(entry.foodName || entry.mealName) && (
                  <span className="text-gray-400 block text-xs mt-0.5">
                    {entry.foodName || entry.mealName}
                  </span>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("totals.protein", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Protein
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.protein
              : data.entries[0].protein;
            return (
              <MacroCell value={value} suffix="g" color="text-green-400" />
            );
          },
        }),
        columnHelper.accessor("totals.carbs", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Carbs
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.carbs
              : data.entries[0].carbs;
            return <MacroCell value={value} suffix="g" color="text-blue-400" />;
          },
        }),
        columnHelper.accessor("totals.fats", {
          header: () => (
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Fats
            </div>
          ),
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.fats
              : data.entries[0].fats;
            return <MacroCell value={value} suffix="g" color="text-red-400" />;
          },
        }),
        columnHelper.accessor("totals.calories", {
          header: "Calories",
          cell: ({ row }) => {
            const data = row.original;
            const value = data.isGroup
              ? data.totals.calories
              : calculateCalories(
                  data.entries[0].protein,
                  data.entries[0].carbs,
                  data.entries[0].fats
                );
            return (
              <MacroCell value={value} suffix=" kcal" color="text-white" />
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: "Actions",
          cell: ({ row }) => {
            const data = row.original;
            if (data.isGroup) {
              return (
                <button
                  onClick={(e) => handleDeleteDate(data.date, e)}
                  className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Delete all entries for ${formatDate(data.date)}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              );
            } else {
              const entry = data.entries[0];
              return (
                <ActionButtonGroup
                  onEdit={() => onEdit(entry)}
                  onDelete={() => deleteEntry(entry.id)}
                  isDeleting={isDeleting}
                />
              );
            }
          },
        }),
      ],
      [
        collapsedDates,
        formatDate,
        formatTimeFromEntry,
        capitalizeFirstLetter,
        calculateCalories,
        handleDeleteDate,
        onEdit,
        deleteEntry,
        isDeleting,
      ]
    );

    // Initialize table
    const table = useReactTable({
      data: tableData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    return (
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50"
                    style={{ width: "14.285%" }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {table.getRowModel().rows.map((row, index) => {
                const data = row.original;
                const isGroup = data.isGroup;
                const isAdditionalEntry =
                  index >=
                  (showAllDates
                    ? groupedEntries.length * 2
                    : Math.min(groupedEntries.length * 2, 10));

                return (
                  <motion.tr
                    key={row.id}
                    className={
                      isGroup
                        ? "bg-indigo-600/10 border-t border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors group"
                        : "border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                    }
                    onClick={
                      isGroup ? () => toggleDateCollapse(data.date) : undefined
                    }
                    initial={{
                      opacity: 0,
                      y: isAdditionalEntry ? 20 : isGroup ? 0 : -10,
                      scale: isAdditionalEntry ? 0.95 : 1,
                    }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      delay: isGroup ? 0 : index * 0.05,
                      ease: "easeOut",
                    }}
                    layout
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2.5 text-center"
                        style={{ width: "14.285%" }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    );
  }
);

DesktopEntryTable.displayName = "DesktopEntryTable";

export default DesktopEntryTable;

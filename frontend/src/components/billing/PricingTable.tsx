import {
  CellContext,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import React, { memo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import ProBadge from "@/components/billing/ProBadge";
import { TabButton } from "@/components/ui";
import { PRICING, PRICING_PLANS } from "@/config/pricing";

// Memoize feature arrays outside the component to prevent re-computation on every render
const freeFeatures = PRICING_PLANS.free.features;
const proFeatures = PRICING_PLANS.pro.features;
const allFeatures = [...new Set([...freeFeatures, ...proFeatures])];

interface PricingTableProps {
  onUpgrade?: (plan: "monthly" | "yearly") => void;
  showProButton?: boolean;
  selectedPlan: "monthly" | "yearly";
  setSelectedPlan: React.Dispatch<React.SetStateAction<"monthly" | "yearly">>;
}

interface FeatureRow {
  feature: string;
  free: boolean;
  pro: boolean;
}

/**
 * PricingTable - Shows Free vs. Pro features
 * Usage: <PricingTable onUpgrade={...} />
 */

const PricingTable: React.FC<PricingTableProps> = ({
  onUpgrade,
  showProButton = true,
  selectedPlan,
  setSelectedPlan,
}) => {
  // Map to FeatureRow[] using pre-computed feature arrays
  const data: FeatureRow[] = React.useMemo(
    () =>
      allFeatures.map((feature) => ({
        feature,
        free: freeFeatures.includes(feature),
        pro: proFeatures.includes(feature),
      })),
    [], // Dependencies are constant, so this only runs once
  );

  const columns = React.useMemo<ColumnDef<FeatureRow, unknown>[]>(
    () => [
      {
        accessorKey: "feature",
        header: () => (
          <div className="px-5 py-4 text-base font-semibold text-gray-200 bg-transparent flex flex-col items-start justify-center min-h-[72px]">
            <span>Feature</span>
            <span
              className="block text-transparent select-none"
              aria-hidden="true"
            >
              placeholder
            </span>
          </div>
        ),
        cell: (info: CellContext<FeatureRow, unknown>) => (
          <span
            className="text-left text-gray-200 font-medium"
            style={{ lineHeight: "1.5" }}
          >
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "free",
        header: () => (
          <div className="px-5 py-4 text-base font-semibold text-gray-300 bg-transparent flex flex-col items-center justify-center min-h-[72px]">
            <span>Free</span>
            <span
              className="block text-transparent select-none"
              aria-hidden="true"
            >
              placeholder
            </span>
          </div>
        ),
        cell: (info: CellContext<FeatureRow, unknown>) =>
          info.getValue() ? (
            <span className="inline-block align-middle text-green-400 font-bold">
              ✔️
            </span>
          ) : (
            <span className="inline-block align-middle text-gray-500 font-bold">
              —
            </span>
          ),
      },
      {
        accessorKey: "pro",
        header: () => {
          // Use centralized PRICING for price and suffix
          const price =
            selectedPlan === "monthly" ? PRICING.monthly : PRICING.yearly;
          const suffix = selectedPlan === "monthly" ? "/mo" : "/year";
          const equivalent =
            selectedPlan === "yearly"
              ? `($${(PRICING.yearly / 12).toFixed(2)}/mo equivalent)`
              : "";
          return (
            <div className="px-5 py-4 text-base font-extrabold text-yellow-200 bg-gradient-to-br relative">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 font-bold text-base shadow-glow border border-yellow-400/30">
                PRO <ProBadge />
              </span>
              <div
                style={{ minHeight: 40 }}
                className="pricing-table-price-container"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={selectedPlan}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="block text-yellow-300 text-lg font-extrabold mt-2 drop-shadow-glow text-center"
                    style={{ minWidth: "120px" }}
                  >
                    <AnimatedNumber
                      value={price}
                      toFixedValue={2}
                      duration={0.5}
                      prefix="$"
                      className="inline-block"
                    />
                    <span className="text-base font-semibold text-yellow-200">
                      {suffix}
                    </span>
                  </motion.span>
                </AnimatePresence>
                <span
                  className={
                    "block text-xs font-semibold mt-1 text-yellow-300 transition-opacity duration-200"
                  }
                  style={{
                    minHeight: 18,
                    opacity: selectedPlan === "yearly" ? 1 : 0,
                    visibility:
                      selectedPlan === "yearly" ? "visible" : "hidden",
                  }}
                  aria-hidden={selectedPlan !== "yearly"}
                >
                  {equivalent}
                </span>
              </div>
            </div>
          );
        },
        cell: (info: CellContext<FeatureRow, unknown>) =>
          info.getValue() ? (
            <span className="inline-block align-middle text-yellow-300 font-bold">
              ✔️
            </span>
          ) : (
            <span className="inline-block align-middle text-gray-500 font-bold">
              —
            </span>
          ),
      },
    ],
    [selectedPlan],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {" "}
      <style>{`
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.12); }
        }
        .pricing-table-price-container {
          min-width: 140px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 767px) {
          .responsive-pricing-table thead {
            display: none;
          }
          .responsive-pricing-table tr {
            display: block;
            margin-bottom: 1rem;
            border-radius: 0.5rem;
            border: 1px solid rgb(55 65 81 / 0.6);
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
          }
          .responsive-pricing-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            text-align: right;
            border-bottom: 1px solid rgb(55 65 81 / 0.6);
          }
          .responsive-pricing-table tr td:last-child {
            border-bottom: 0;
          }
          .responsive-pricing-table td[data-label]::before {
            content: attr(data-label);
            font-weight: 600;
            text-align: left;
            color: #d1d5db; /* gray-300 */
          }
          .responsive-pricing-table .feature-cell {
            background-color: rgb(55 65 81 / 0.2);
            font-weight: 600;
            justify-content: flex-start;
          }
          .responsive-pricing-table .feature-cell::before {
            display: none;
          }
        }
      `}</style>
      <div className="w-full max-w-full bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl shadow-xl p-4 border border-gray-700/60 scrollbar-hide overflow-x-hidden">
        {/* Plan selection pill group using TabButton */}
        <div className="flex justify-center pb-4">
          <div
            className="pricing-pill-group inline-flex bg-gray-800 border border-gray-700 rounded-full p-1 gap-0 select-none overflow-hidden"
            role="tablist"
            aria-label="Plan Toggle"
          >
            <TabButton
              active={selectedPlan === "monthly"}
              onClick={() => setSelectedPlan("monthly")}
              layoutId="pricing-plan-toggle"
              isMotion={true}
              rounded="rounded-full"
              activeBg="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-300"
            >
              <span
                className={`text-sm font-semibold ${
                  selectedPlan === "monthly"
                    ? "text-gray-900"
                    : "text-yellow-300"
                }`}
              >
                Monthly
              </span>
            </TabButton>
            <TabButton
              active={selectedPlan === "yearly"}
              onClick={() => setSelectedPlan("yearly")}
              layoutId="pricing-plan-toggle"
              isMotion={true}
              rounded="rounded-full"
              activeBg="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-300"
            >
              <span
                className={`text-sm font-semibold ${
                  selectedPlan === "yearly"
                    ? "text-gray-900"
                    : "text-yellow-300"
                }`}
              >
                Yearly
              </span>
            </TabButton>
          </div>
          {/* Scoped style override for pill group layout and hover, highlight now handled by TabButton props */}
          <style>{`
            .pricing-pill-group [role=tab] {
              min-width: 90px;
              height: 40px;
              padding: 0 18px;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s, color 0.2s;
              /* Remove any purple background */
              background: none !important;
            }
            .pricing-pill-group [role=tab]:first-child {
              border-top-right-radius: 0;
              border-bottom-right-radius: 0;
            }
            .pricing-pill-group [role=tab]:last-child {
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
            }
          `}</style>
        </div>
        <div>
          <table className="responsive-pricing-table w-full max-w-full border-separate border-spacing-0 text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-gray-700/60"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={
                        header.index === 0
                          ? "text-left px-5 py-4 text-base font-semibold text-gray-200 bg-transparent border-b border-gray-700/60"
                          : header.index === 1
                            ? "px-5 py-4 text-base font-semibold text-gray-300 bg-transparent border-b border-gray-700/60"
                            : "px-5 py-4 text-base font-extrabold text-yellow-200 bg-gradient-to-br from-yellow-500/20 to-orange-400/20 shadow-[0_0_8px_2px_rgba(255,200,0,0.12)] relative border-b border-gray-700/60"
                      }
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="md:transition-transform md:duration-200 md:hover:-translate-y-1 md:hover:shadow-lg"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-label={
                        cell.column.id === "free"
                          ? "Free"
                          : cell.column.id === "pro"
                            ? "Pro"
                            : undefined
                      }
                      className={
                        cell.column.id === "feature"
                          ? `feature-cell px-3 py-2 text-left text-gray-200 font-medium${
                              index === data.length - 1
                                ? ""
                                : " md:border-b md:border-gray-700/60"
                            }`
                          : cell.column.id === "free"
                            ? `px-3 py-2 text-center${
                                row.index === data.length - 1
                                  ? ""
                                  : " md:border-b md:border-gray-700/60"
                              }`
                            : `px-3 py-2 text-center bg-gradient-to-br from-yellow-900/10 to-orange-900/10${
                                row.index === data.length - 1
                                  ? ""
                                  : " md:border-b md:border-yellow-700/30"
                              }`
                      }
                      style={
                        cell.column.id === "feature"
                          ? { lineHeight: "1.5" }
                          : {}
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showProButton && (
        <div className="mt-5 flex flex-col items-center">
          <button
            className="w-full max-w-xs bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-extrabold py-4 px-12 rounded-2xl text-xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-yellow-300 border-0 mb-2 transition-all duration-150 tracking-wide drop-shadow-lg active:scale-95"
            style={{ transition: "transform 0.1s" }}
            onClick={() => onUpgrade && onUpgrade(selectedPlan)}
            aria-label="Upgrade to Pro"
          >
            Get Started with Pro
          </button>
          <AnimatePresence mode="wait">
            <motion.span
              key={selectedPlan}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="text-xs text-yellow-700 font-medium dark:text-yellow-200"
              style={{ marginTop: "8px" }}
            >
              {selectedPlan === "monthly"
                ? `$${PRICING.monthly}/month • Cancel anytime`
                : `$${PRICING.yearly}/year • $${(PRICING.yearly / 12).toFixed(
                    2,
                  )}/mo equivalent • Cancel anytime`}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default memo(PricingTable);

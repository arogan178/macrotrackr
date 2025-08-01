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
          <div className="flex min-h-[72px] flex-col items-start justify-center bg-transparent px-5 py-4 text-base font-semibold text-foreground">
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
            className="text-left font-medium text-foreground"
            style={{ lineHeight: "1.5" }}
          >
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "free",
        header: () => (
          <div className="flex min-h-[72px] flex-col items-center justify-center bg-transparent px-5 py-4 text-base font-semibold text-foreground">
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
            <span className="inline-block align-middle font-bold text-success">
              ✔️
            </span>
          ) : (
            <span className="inline-block align-middle font-bold text-foreground">
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
            <div className="relative bg-gradient-to-br px-5 py-4 text-base font-extrabold text-warning">
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-warning/20 px-3 py-1 text-base font-bold text-warning shadow-glow">
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
                    className="drop-shadow-glow mt-2 block text-center text-lg font-extrabold text-warning"
                    style={{ minWidth: "120px" }}
                  >
                    <AnimatedNumber
                      value={price}
                      toFixedValue={2}
                      duration={0.5}
                      prefix="$"
                      className="inline-block"
                    />
                    <span className="text-base font-semibold text-warning">
                      {suffix}
                    </span>
                  </motion.span>
                </AnimatePresence>
                <span
                  className={
                    "mt-1 block text-xs font-semibold text-warning transition-opacity duration-200"
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
            <span className="inline-block align-middle font-bold text-warning">
              ✔️
            </span>
          ) : (
            <span className="inline-block align-middle font-bold text-foreground">
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
      <div className="scrollbar-hide w-full max-w-full overflow-x-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-gray-900/90 to-gray-800/90 p-4 shadow-modal">
        {/* Plan selection pill group using TabButton */}
        <div className="flex justify-center pb-4">
          <div
            className="pricing-pill-group inline-flex gap-0 overflow-hidden rounded-full border border-border bg-surface p-1 select-none"
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
                    ? "text-foreground"
                    : "text-warning"
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
                  selectedPlan === "yearly" ? "text-foreground" : "text-warning"
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
                <tr key={headerGroup.id} className="border-b border-border/60">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={
                        header.index === 0
                          ? "border-b border-border/60 bg-transparent px-5 py-4 text-left text-base font-semibold text-foreground"
                          : header.index === 1
                            ? "border-b border-border/60 bg-transparent px-5 py-4 text-base font-semibold text-foreground"
                            : "relative border-b border-border/60 bg-gradient-to-br from-yellow-500/20 to-orange-400/20 px-5 py-4 text-base font-extrabold text-warning shadow-glow"
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
                  className="md:transition-transform md:duration-200 md:hover:-translate-y-1 md:hover:shadow-primary"
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
                          ? `feature-cell px-3 py-2 text-left font-medium text-foreground${
                              index === data.length - 1
                                ? ""
                                : " md:border-b md:border-border/60"
                            }`
                          : cell.column.id === "free"
                            ? `px-3 py-2 text-center${
                                row.index === data.length - 1
                                  ? ""
                                  : " md:border-b md:border-border/60"
                              }`
                            : `bg-gradient-to-br from-yellow-900/10 to-orange-900/10 px-3 py-2 text-center${
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
            className="mb-2 w-full max-w-xs rounded-2xl border-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 px-12 py-4 text-xl font-extrabold tracking-wide text-black shadow-modal drop-shadow-primary transition-all duration-150 hover:from-yellow-500 hover:to-orange-500 focus:ring-4 focus:ring-yellow-300 focus:outline-none active:scale-95"
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
              className="text-xs font-medium text-warning dark:text-warning"
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

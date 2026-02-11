import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

import { BarChartIcon, BookIcon, IconButton } from "@/components/ui";
import { useWeightLog } from "@/hooks/queries/useGoals";

import WeightGoalProgressChart from "./WeightGoalProgressChart";
import WeightLogList from "./WeightLogList";

type TabId = "chart" | "list";

function WeightProgressTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("chart");

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "chart", label: "Progress Chart", icon: BarChartIcon },
    { id: "list", label: "Weight Log", icon: BookIcon },
  ];
  // Use TanStack Query hooks instead of Zustand store
  const { data: weightLog = [], isLoading } = useWeightLog();

  // Bulk delete modal state
  const [isBulkConfirmModalOpen, setIsBulkConfirmModalOpen] = useState(false);
  const handleBulkDelete = () => setIsBulkConfirmModalOpen(true);
  const handleBulkCancel = () => setIsBulkConfirmModalOpen(false);
  // Removed unused handleBulkConfirm placeholder to satisfy no-unused-vars

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-primary">
      {/* Tab Navigation + Delete All Button */}
      <div className="flex items-center border-b border-border/50 pt-3 pr-8 pl-1">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ease-out focus:outline-none ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="mr-2 " />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary"
                  layoutId="underline"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Delete All Button */}
        {activeTab === "list" && weightLog.length > 1 && (
          <IconButton
            variant="delete"
            ariaLabel="Delete all weight log entries"
            onClick={handleBulkDelete}
            disabled={isLoading}
            tooltip="Delete All"
            className="pl-4"
          />
        )}
      </div>

      {/* Tab Content Area */}
      <div className="relative px-6 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "chart" && <WeightGoalProgressChart />}
            {activeTab === "list" && (
              <WeightLogList
                isBulkConfirmModalOpen={isBulkConfirmModalOpen}
                onBulkCancel={handleBulkCancel}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WeightProgressTabs;

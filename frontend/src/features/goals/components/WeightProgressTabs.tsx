import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

import { IconButton } from "@/components/ui";
import { BarChartIcon, BookIcon } from "@/components/ui"; // Using local icons
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
  const handleBulkConfirm = () => setIsBulkConfirmModalOpen(false); // Will be handled in WeightLogList

  return (
    <div className="bg-surface/40 backdrop-blur-sm rounded-xl border border-border/50 shadow-primary overflow-hidden">
      {/* Tab Navigation + Delete All Button */}
      <div className="flex border-b border-border/50 pl-1 pr-8 pt-3 items-center">
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
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  layoutId="underline" // Animate the underline
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
            size="sm"
            className="pl-4"
          />
        )}
      </div>

      {/* Tab Content Area */}
      <div className="px-6 py-3 relative">
        {" "}
        {/* Added relative positioning for AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab} // Key change triggers animation
            initial={{ opacity: 0, y: 15 }} // Start slightly below and faded out
            animate={{ opacity: 1, y: 0 }} // Animate to fully visible and original position
            exit={{ opacity: 0, y: -15 }} // Exit slightly above and faded out
            transition={{ duration: 0.25 }} // Smooth transition
            // Removed absolute positioning to let content flow
          >
            {activeTab === "chart" && <WeightGoalProgressChart />}
            {activeTab === "list" && (
              <WeightLogList
                isBulkConfirmModalOpen={isBulkConfirmModalOpen}
                onBulkConfirm={handleBulkConfirm}
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

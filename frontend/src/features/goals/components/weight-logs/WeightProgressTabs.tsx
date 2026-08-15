import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { BarChartIcon, BookIcon, IconButton, TabBar } from "@/components/ui";
import { useWeightLog } from "@/hooks/queries/useGoals";

import WeightGoalProgressChart from "../weight-goals/WeightGoalProgressChart";

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
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      {/* The shared TabBar, not a bespoke green-underline set. This was the last
          tab strip in the app still drawing its own active state, so Goals had
          two different-looking tab controls stacked on one page. */}
      <div className="flex items-center gap-3 border-b border-border p-3">
        <TabBar
          items={tabs.map((tab) => ({
            key: tab.id,
            label: (
              <span className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </span>
            ),
          }))}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabId)}
          isMotion
          layoutId="weightProgressTab"
          size="sm"
        />
        <div className="flex-1" />
        {/* Delete All Button */}
        {activeTab === "list" && weightLog.length > 1 && (
          <IconButton
            variant="delete"
            ariaLabel="Delete all weight log entries"
            onClick={handleBulkDelete}
            disabled={isLoading}
            tooltip="Delete all"
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

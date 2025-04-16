// filepath: d:\Users\Andrea Bugeja\Documents\GitHub\app\macro_tracker\frontend\src\features\goals\components\WeightProgressTabs.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import WeightGoalProgressChart from "./WeightGoalProgressChart";
import WeightLogList from "./WeightLogList";
import { BarChartIcon, BookIcon } from "@/components/Icons"; // Using local icons

type TabId = "chart" | "list";

function WeightProgressTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("chart");

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "chart", label: "Progress Chart", icon: BarChartIcon },
    { id: "list", label: "Weight Log", icon: BookIcon },
  ];

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700/50 px-4 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ease-out focus:outline-none ${
              activeTab === tab.id
                ? "text-indigo-300"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                layoutId="underline" // Animate the underline
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="p-6 relative">
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
            {activeTab === "list" && <WeightLogList />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WeightProgressTabs;

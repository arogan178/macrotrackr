import { useState } from "react";
import { DateRangeOption, DATE_RANGE_OPTIONS } from "../types";

interface DateRangeSelectorProps {
  currentRange: string;
  onRangeChange: (range: string) => void;
  onCustomRangeClick: () => void;
  onExportClick: () => void;
  isExportDisabled: boolean;
}

export default function DateRangeSelector({
  currentRange,
  onRangeChange,
  onCustomRangeClick,
  onExportClick,
  isExportDisabled,
}: DateRangeSelectorProps) {
  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center">
          <span className="text-gray-300 font-medium mr-3">Time Period:</span>
          <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-700/50">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentRange === option.value
                    ? "bg-indigo-900/50 text-indigo-100 shadow-sm"
                    : "text-gray-400 hover:text-gray-300"
                }`}
                onClick={() =>
                  option.value === "custom"
                    ? onCustomRangeClick()
                    : onRangeChange(option.value)
                }
                aria-label={`Set time period to ${option.label}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onExportClick}
          disabled={isExportDisabled}
          className="px-4 py-2 bg-indigo-700/60 hover:bg-indigo-700/80 text-indigo-100 rounded-lg text-sm font-medium flex items-center transition-all duration-200 border border-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export data as CSV file"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            ></path>
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}

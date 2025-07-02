import { motion } from "motion/react";

function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`bg-gray-800/70 rounded-xl border border-gray-700/50 p-5 flex flex-col animate-pulse ${className}`}
    >
      <div className="h-4 w-1/3 bg-gray-700 rounded mb-2" />
      <div className="h-8 w-2/3 bg-gray-700 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-5 h-80 flex items-center justify-center animate-pulse">
      <div className="w-full h-48 bg-gray-700 rounded" />
    </div>
  );
}

export default function ReportingPageSkeleton() {
  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <div className="h-8 w-1/2 bg-gray-700 rounded mb-2 animate-pulse" />
        <div className="h-4 w-1/3 bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <SkeletonCard className="flex-1 min-w-[120px]" />
          <SkeletonCard className="flex-1 min-w-[120px]" />
          <SkeletonCard className="flex-1 min-w-[120px]" />
          <SkeletonCard className="flex-1 min-w-[120px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 mb-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-5 animate-pulse h-40" />
    </motion.div>
  );
}

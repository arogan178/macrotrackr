export default function ReportingPageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Title and subtitle */}
      <div className="mb-6">
        <div className="h-8 w-1/3 bg-gray-700 rounded mb-2" />
        <div className="h-4 w-1/4 bg-gray-700 rounded" />
      </div>

      {/* Summary cards */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="flex-1 min-w-[120px] h-24 bg-gray-800/40 rounded-2xl"
            />
          ))}
        </div>
      </div>

      {/* MealTimeBreakdown & MacroDensityBreakdown (2-column grid on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="h-56 bg-gray-800/40 rounded-2xl" />
        <div className="h-56 bg-gray-800/40 rounded-2xl" />
      </div>

      {/* Charts (2-column grid on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="h-80 bg-gray-800/40 rounded-2xl" />
        <div className="h-80 bg-gray-800/40 rounded-2xl" />
      </div>

      {/* Unified Insights section */}
      <div className="h-40 bg-gray-800/40 rounded-2xl mb-6" />
    </div>
  );
}

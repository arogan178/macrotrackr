export default function ReportingPageSkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* DateRangeSelector */}
      <div className="mb-6 flex justify-end">
        <div className="h-10 w-48 rounded-control bg-surface-2" />
      </div>

      {/* Summary Stats (4 cards) */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="h-28 rounded-card bg-surface-2" />
        ))}
      </div>

      {/* MealTimeBreakdown & MacroDensityBreakdown */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-72 rounded-card bg-surface-2" />
        <div className="h-72 rounded-card bg-surface-2" />
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-[340px] rounded-card bg-surface-2" />
        <div className="h-[340px] rounded-card bg-surface-2" />
      </div>

      {/* Unified Insights Dashboard */}
      <div className="mb-6 rounded-card bg-surface p-6">
        <div className="mb-6 h-6 w-40 rounded-control bg-surface-2" />
        {/* Metric Cards */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-40 rounded-card bg-surface-2" />
          ))}
        </div>
        {/* At a glance */}
        <div className="h-24 w-full rounded-card bg-surface-2" />
      </div>
    </div>
  );
}

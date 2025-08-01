export default function ReportingPageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Title and subtitle */}
      <div className="mb-6">
        <div className="mb-2 h-8 w-1/3 rounded bg-surface" />
        <div className="h-4 w-1/4 rounded bg-surface" />
      </div>

      {/* Summary cards */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="h-24 min-w-[120px] flex-1 rounded-2xl bg-surface/40"
            />
          ))}
        </div>
      </div>

      {/* MealTimeBreakdown & MacroDensityBreakdown (2-column grid on md+) */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-56 rounded-2xl bg-surface/40" />
        <div className="h-56 rounded-2xl bg-surface/40" />
      </div>

      {/* Charts (2-column grid on md+) */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-80 rounded-2xl bg-surface/40" />
        <div className="h-80 rounded-2xl bg-surface/40" />
      </div>

      {/* Unified Insights section */}
      <div className="mb-6 h-40 rounded-2xl bg-surface/40" />
    </div>
  );
}

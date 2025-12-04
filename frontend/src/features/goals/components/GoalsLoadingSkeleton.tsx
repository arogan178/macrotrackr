export default function GoalsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Title and subtitle */}
      <div className="mb-6">
        <div className="mb-2 h-8 w-1/3 rounded bg-surface-2" />
        <div className="h-4 w-1/4 rounded bg-surface-2" />
      </div>

      {/* Summary cards */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="h-24 min-w-30 flex-1 rounded-2xl bg-surface-2"
            />
          ))}
        </div>
      </div>

      {/* Main content grids (e.g., progress, habits) */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-56 rounded-2xl bg-surface-2" />
        <div className="h-56 rounded-2xl bg-surface-2" />
      </div>

      {/* Additional charts or sections if needed */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-80 rounded-2xl bg-surface-2" />
        <div className="h-80 rounded-2xl bg-surface-2" />
      </div>

      {/* Final section (e.g., insights, actions) */}
      <div className="mb-6 h-40 rounded-2xl bg-surface-2" />
    </div>
  );
}

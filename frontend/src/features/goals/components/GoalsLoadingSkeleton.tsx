export default function GoalsLoadingSkeleton() {
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
              className="bg-surface/ h-24 min-w-[120px] flex-1 rounded-2xl"
            />
          ))}
        </div>
      </div>

      {/* Main content grids (e.g., progress, habits) */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-surface/ h-56 rounded-2xl" />
        <div className="bg-surface/ h-56 rounded-2xl" />
      </div>

      {/* Additional charts or sections if needed */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-surface/ h-80 rounded-2xl" />
        <div className="bg-surface/ h-80 rounded-2xl" />
      </div>

      {/* Final section (e.g., insights, actions) */}
      <div className="bg-surface/ mb-6 h-40 rounded-2xl" />
    </div>
  );
}

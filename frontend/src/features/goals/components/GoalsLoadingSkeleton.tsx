export default function GoalsLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* WeightGoalStatus Card */}
      <div className="rounded-2xl border border-border/60 bg-surface p-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center">
            <div className="mr-4 h-14 w-14 rounded-xl bg-surface-2" />
            <div>
              <div className="mb-2 h-6 w-32 rounded bg-surface-2" />
              <div className="h-4 w-40 rounded bg-surface-2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 rounded-lg bg-surface-2" />
            <div className="h-10 w-10 rounded-lg bg-surface-2" />
          </div>
        </div>
        
        <div className="mb-8 h-24 rounded-2xl bg-surface-2" />
        
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-24 rounded-2xl bg-surface-2" />
          <div className="h-24 rounded-2xl bg-surface-2" />
          <div className="h-24 rounded-2xl bg-surface-2" />
        </div>
        
        <div className="h-40 rounded-2xl bg-surface-2" />
      </div>

      {/* WeightProgressTabs Card */}
      <div className="h-80 rounded-2xl border border-border/60 bg-surface" />

      {/* HabitTracker Card */}
      <div className="h-64 rounded-2xl border border-border/60 bg-surface" />
    </div>
  );
}

export default function SettingsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Title and tab navigation area */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="h-8 w-1/3 rounded bg-surface-2" />
        <div className="flex space-x-1 rounded-lg bg-surface-2 p-1">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-8 w-20 rounded bg-surface-3" />
          ))}
        </div>
      </div>

      {/* Form content area */}
      <div className="space-y-6">
        {/* Form sections */}
        {[1, 2, 3].map((index) => (
          <div key={index} className="rounded-2xl bg-surface-2 p-6">
            <div className="mb-4 h-4 w-1/4 rounded bg-surface-3" />
            <div className="space-y-3">
              <div className="h-10 rounded bg-surface-3" />
              <div className="h-10 rounded bg-surface-3" />
            </div>
          </div>
        ))}

        {/* Icon buttons area */}
        <div className="flex justify-end">
          <div className="h-10 w-24 rounded-lg bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Title and tab navigation area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="h-8 w-1/3 bg-surface rounded" />
        <div className="flex space-x-1 p-1 bg-surface/40 rounded-lg">
          {[1, 2, 3].map((index) => (
            <div key={index} className="h-8 w-20 bg-surface rounded" />
          ))}
        </div>
      </div>

      {/* Form content area */}
      <div className="space-y-6">
        {/* Form sections */}
        {[1, 2, 3].map((index) => (
          <div key={index} className="bg-surface/40 rounded-2xl p-6">
            <div className="h-4 w-1/4 bg-surface rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-surface rounded" />
              <div className="h-10 bg-surface rounded" />
            </div>
          </div>
        ))}

        {/* Action buttons area */}
        <div className="flex justify-end">
          <div className="h-10 w-24 bg-surface/40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

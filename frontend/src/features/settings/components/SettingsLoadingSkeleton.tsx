export default function SettingsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Form content area */}
      <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center">
            <div className="mr-4 h-12 w-12 rounded-control bg-surface-2" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-control bg-surface-2" />
              <div className="h-4 w-64 rounded-control bg-surface-2" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 rounded-control bg-surface-2" />
              <div className="h-10 rounded-control bg-surface-2" />
            </div>
          ))}
        </div>

        {/* Submit button area */}
        <div className="mt-8 flex justify-end">
          <div className="h-12 w-32 rounded-control bg-surface-2" />
        </div>
      </div>
    </div>
  );
}

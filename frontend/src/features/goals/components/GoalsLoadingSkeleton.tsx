function GoalsLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gray-800/40 rounded-2xl h-64"></div>
        <div className="bg-gray-800/40 rounded-2xl h-64"></div>
      </div>

      <div className="h-6 bg-gray-700 rounded w-1/6 mb-4"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800/40 rounded-2xl h-32"></div>
        ))}
      </div>
    </div>
  );
}

export default GoalsLoadingSkeleton;

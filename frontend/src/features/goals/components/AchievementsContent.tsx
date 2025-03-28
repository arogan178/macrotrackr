function AchievementsContent() {
  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-b from-yellow-900/20 to-transparent p-8">
        <div className="flex items-center mb-8">
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl shadow-lg mr-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100 mb-1">
              Your Achievements
            </h2>
            <p className="text-gray-400 text-sm">
              Celebrate your health and fitness milestones
            </p>
          </div>
          <div className="ml-auto">
            <select className="bg-gray-700/50 text-gray-300 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>All Time</option>
              <option>This Year</option>
              <option>This Month</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Achievement Card */}
          <div className="group bg-gray-700/30 border border-gray-700/50 rounded-xl overflow-hidden hover:bg-gray-700/40 hover:border-gray-600/50 transition-all duration-300 shadow-md hover:shadow-lg">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 p-2.5 rounded-lg group-hover:from-yellow-500/30 group-hover:to-amber-600/30 transition-all duration-300">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="bg-gray-800/60 px-2.5 py-1 rounded-full">
                  <span className="text-xs text-gray-400">Feb 20, 2025</span>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-2 text-gray-200 group-hover:text-white transition-colors">
                Lost first kilogram
              </h3>
              <div className="text-gray-400 text-sm mb-4">
                Taking the first step toward your weight goal
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-gray-400">Weight Loss</span>
                </div>
                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 text-xs px-2.5 py-1 rounded-full">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Achieved</span>
                </div>
              </div>
            </div>
          </div>

          {/* Empty state for additional achievements */}
          <div className="group bg-gray-700/20 border border-gray-700/30 border-dashed rounded-xl overflow-hidden hover:bg-gray-700/30 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-700/40 p-3 rounded-full mb-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              More achievements coming
            </h3>
            <p className="text-gray-500 text-xs">Keep up the good work!</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button className="px-5 py-2.5 bg-gray-700/60 border border-gray-600/50 rounded-lg text-gray-200 hover:bg-gray-700/80 transition-all duration-300 flex items-center gap-2 group">
            <span>View All Achievements</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AchievementsContent;

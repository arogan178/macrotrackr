import FormButton from "@/components/form/FormButton";
interface GoalsModeToggleProps {
  activeMode: "active" | "achieved";
  onToggle: () => void;
}

function GoalsModeToggle({ activeMode, onToggle }: GoalsModeToggleProps) {
  return (
    <div className="relative flex items-center bg-gray-800/40 rounded-xl p-1 w-fit">
      <FormButton
        type="button"
        onClick={activeMode === "achieved" ? onToggle : undefined}
        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeMode === "active"
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-400 hover:text-gray-300"
        }`}
        variant={activeMode === "active" ? undefined : "ghost"}
      >
        <div className="flex items-center">
          <svg
            className={`w-4 h-4 mr-2 ${
              activeMode === "active" ? "text-white" : "text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Active Goals
        </div>
      </FormButton>
      <FormButton
        type="button"
        onClick={activeMode === "active" ? onToggle : undefined}
        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeMode === "achieved"
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-400 hover:text-gray-300"
        }`}
        variant={activeMode === "achieved" ? undefined : "ghost"}
      >
        <div className="flex items-center">
          <svg
            className={`w-4 h-4 mr-2 ${
              activeMode === "achieved" ? "text-white" : "text-gray-400"
            }`}
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
          Achievements
        </div>
      </FormButton>
    </div>
  );
}

export default GoalsModeToggle;

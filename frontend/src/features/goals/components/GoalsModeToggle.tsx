import FormButton from "@/components/form/FormButton";
import { AwardIcon, GoalsIcon } from "@/components/Icons";
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
        icon={
          <GoalsIcon
            className={`w-4 h-4 mr-2 ${
              activeMode === "active" ? "text-white" : "text-gray-400"
            }`}
          />
        }
      >
        <div className="flex items-center">Active Goals</div>
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
        icon={<AwardIcon />}
      >
        <div className="flex items-center">Achievements</div>
      </FormButton>
    </div>
  );
}

export default GoalsModeToggle;

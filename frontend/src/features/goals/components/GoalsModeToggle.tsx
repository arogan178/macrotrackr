import { AwardIcon, Button, GoalsIcon } from "@/components/ui";

interface GoalsModeToggleProps {
  activeMode: "active" | "achieved";
  onToggle: () => void;
}

function GoalsModeToggle({ activeMode, onToggle }: GoalsModeToggleProps) {
  const isActive = activeMode === "active";
  const isAchieved = activeMode === "achieved";

  return (
    <div
      className="bg-surface/ relative flex w-fit items-center rounded-xl p-1"
      role="tablist"
      aria-label="Goals view mode"
    >
      <Button
        type="button"
        onClick={isAchieved ? onToggle : undefined}
        className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-primary text-foreground shadow-surface"
            : "text-foreground hover:text-foreground"
        }`}
        variant={isActive ? undefined : "ghost"}
        icon={<GoalsIcon className="mr-2 h-4 w-4 text-foreground" />}
        aria-selected={isActive}
        aria-label="Show Active Goals"
      >
        <div className="flex items-center">Active Goals</div>
      </Button>
      <Button
        type="button"
        onClick={isActive ? onToggle : undefined}
        className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
          isAchieved
            ? "bg-primary text-foreground shadow-surface"
            : "text-foreground hover:text-foreground"
        }`}
        variant={isAchieved ? undefined : "ghost"}
        icon={<AwardIcon />}
        aria-selected={isAchieved}
        aria-label="Show Achievements"
      >
        <div className="flex items-center">Achievements</div>
      </Button>
    </div>
  );
}

export default GoalsModeToggle;

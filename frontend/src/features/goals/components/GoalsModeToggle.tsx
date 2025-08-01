import { AwardIcon, Button, GoalsIcon } from "@/components/ui";

interface GoalsModeToggleProps {
  activeMode: "active" | "achieved";
  onToggle: () => void;
}

function GoalsModeToggle({ activeMode, onToggle }: GoalsModeToggleProps) {
  return (
    <div className="relative flex w-fit items-center rounded-xl bg-surface/40 p-1">
      <Button
        type="button"
        onClick={activeMode === "achieved" ? onToggle : undefined}
        className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
          activeMode === "active"
            ? "bg-primary text-foreground shadow-surface"
            : "text-foreground hover:text-foreground"
        }`}
        variant={activeMode === "active" ? undefined : "ghost"}
        icon={
          <GoalsIcon
            className={`mr-2 h-4 w-4 ${
              activeMode === "active" ? "text-foreground" : "text-foreground"
            }`}
          />
        }
      >
        <div className="flex items-center">Active Goals</div>
      </Button>
      <Button
        type="button"
        onClick={activeMode === "active" ? onToggle : undefined}
        className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
          activeMode === "achieved"
            ? "bg-primary text-foreground shadow-surface"
            : "text-foreground hover:text-foreground"
        }`}
        variant={activeMode === "achieved" ? undefined : "ghost"}
        icon={<AwardIcon />}
      >
        <div className="flex items-center">Achievements</div>
      </Button>
    </div>
  );
}

export default GoalsModeToggle;

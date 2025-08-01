import { Button, ForwardIcon } from "@/components/ui";

interface ButtonModeToggleProps {
  mode: "login" | "register";
  onToggle: () => void;
}

function ButtonModeToggle({ mode, onToggle }: ButtonModeToggleProps) {
  return (
    <Button
      type="button"
      onClick={onToggle}
      className="group flex flex-col items-center rounded-lg px-6 py-3 text-foreground transition-colors hover:bg-surface/30 hover:text-foreground"
      variant="ghost"
    >
      <div className="text-center">
        <p className="text-sm text-foreground transition-colors group-hover:text-foreground">
          {mode === "login" ? "New User?" : "Already have an account?"}
        </p>
        <div className="mt-1 flex items-center justify-center">
          <span className="font-semibold">
            {mode === "login" ? "Register" : "Login"}
          </span>
          <ForwardIcon />
        </div>
      </div>
    </Button>
  );
}

export default ButtonModeToggle;

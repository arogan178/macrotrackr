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
      aria-label={mode === "login" ? "Switch to register" : "Switch to login"}
      title={mode === "login" ? "Register" : "Login"}
      className="group flex flex-col items-center rounded-lg bg-surface px-6 py-3 text-foreground transition-colors hover:bg-surface-2"
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
          <ForwardIcon className="ml-2 h-4 w-4" />
        </div>
      </div>
    </Button>
  );
}

export default ButtonModeToggle;

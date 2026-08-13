import Panel from "@/components/ui/Panel";
import StateCard from "@/components/ui/StateCard";

interface GoalsErrorStateProps {
  onRetry?: () => void;
  errorMessage?: string;
}

export default function GoalsErrorState({
  onRetry,
  errorMessage = "Couldn't load your goals. Check your connection and try again.",
}: GoalsErrorStateProps) {
  return (
    <Panel padding="none">
      <StateCard
        tone="error"
        title="Couldn't load your goals"
        message={errorMessage}
        action={
          onRetry
            ? { label: "Try again", onClick: onRetry, variant: "primary" }
            : undefined
        }
        secondaryAction={{
          label: "Reload page",
          onClick: () => globalThis.location.reload(),
          variant: "secondary",
        }}
      />
    </Panel>
  );
}

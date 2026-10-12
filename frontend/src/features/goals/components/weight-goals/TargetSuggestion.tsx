import { Button } from "@/components/ui";
import { formatGrouped } from "@/lib/formatNumber";

import {
  describeSuggestion,
  type TargetSuggestion as Suggestion,
} from "../../utils/suggestedTarget";

interface TargetSuggestionProps {
  suggestion: Suggestion;
  isSaving: boolean;
  onUse: () => void;
  onEdit: () => void;
  onDismiss: () => void;
}

export default function TargetSuggestion({
  suggestion,
  isSaving,
  onUse,
  onEdit,
  onDismiss,
}: TargetSuggestionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">{describeSuggestion(suggestion)}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          buttonSize="sm"
          text={`Use ${formatGrouped(suggestion.target)}`}
          isLoading={isSaving}
          loadingText="Saving..."
          onClick={onUse}
        />
        <Button variant="secondary" buttonSize="sm" text="Edit" onClick={onEdit} />
        <Button variant="ghost" buttonSize="sm" text="Not now" onClick={onDismiss} />
      </div>
    </div>
  );
}

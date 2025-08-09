import { useGoalsActions } from "./useGoalsActions";
import { useGoalsData } from "./useGoalsData";
import { useGoalsUiState } from "./useGoalsUiState";

export function useGoalsPage() {
  const ui = useGoalsUiState();
  const data = useGoalsData();
  const actions = useGoalsActions();

  return { ui, data, actions };
}
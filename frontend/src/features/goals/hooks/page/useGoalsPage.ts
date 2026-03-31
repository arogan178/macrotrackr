import { useGoalsActions } from "./useGoalsActions";
import { useGoalsData } from "./useGoalsData";
import { useGoalsUiState } from "./useGoalsUiState";

export function useGoalsController() {
  const ui = useGoalsUiState();
  const data = useGoalsData();
  const actions = useGoalsActions(ui, data);

  return { ui, data, actions };
}

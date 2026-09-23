import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";
import { useStore } from "@/store/store";
import type { MacroEntry } from "@/types/macro";

import HomePage from "./HomePage";

const mutations = vi.hoisted(() => ({
  add: vi.fn(),
  delete: vi.fn(),
  createSavedMeal: vi.fn(),
  deleteState: { isPending: false, variables: undefined as number | undefined },
}));

interface PanelProps {
  deleteEntry: (id: number) => Promise<void>;
  isDeleting: (id: number) => boolean;
  onSaveMeal: (entry: MacroEntry) => Promise<void>;
  onExportCsv: () => Promise<void>;
}
interface FormProps {
  onSubmit: (entry: unknown) => Promise<void>;
}

const captured = vi.hoisted(() => ({
  panel: undefined as PanelProps | undefined,
  form: undefined as FormProps | undefined,
}));

vi.mock("@/api/macros", () => ({
  macrosApi: { getAllHistory: vi.fn() },
}));

vi.mock("@/hooks/queries/useMacroQueries", () => ({
  useAddMacroEntry: () => ({ mutateAsync: mutations.add, isPending: false }),
  useUpdateMacroEntry: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteMacroEntry: () => ({
    mutateAsync: mutations.delete,
    ...mutations.deleteState,
  }),
  useMacroDailyTotals: () => ({ data: undefined }),
  useMacroTargetQuery: () => ({ data: undefined }),
}));

vi.mock("@/hooks/queries/useSavedMeals", () => ({
  useCreateSavedMeal: () => ({ mutateAsync: mutations.createSavedMeal }),
  useDeleteSavedMeal: () => ({ mutateAsync: vi.fn() }),
  useSavedMeals: () => ({ data: { meals: [] } }),
}));

vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useUser: () => ({ data: { id: 1, firstName: "Test" } }),
}));
vi.mock("@/hooks/queries/useGoals", () => ({
  useWeightGoals: () => ({ data: undefined }),
}));
vi.mock("@/hooks/usePageDataSync", () => ({ usePageDataSync: () => {} }));
vi.mock("@/features/macroTracking/hooks/useHomePage", () => ({
  useHistoryPagination: () => ({
    history: [],
    historyHasMore: false,
    isHistoryLoading: false,
    isLoadingMore: false,
    loadMoreHistory: vi.fn(),
    limits: undefined,
  }),
  useHomeHeader: () => ({ title: "Home", subtitle: "" }),
  useNutritionProfile: () => undefined,
}));

vi.mock("@/components/layout/DashboardPageContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/layout/FeaturePage", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/metrics/UserMetricsPanel", () => ({ default: () => null }));
vi.mock("@/features/macroTracking/components/DailySummaryPanel", () => ({
  default: () => null,
}));
vi.mock("@/features/macroTracking/components/EditModal", () => ({
  default: () => null,
}));
vi.mock("@/features/macroTracking/components/AddEntryForm", () => ({
  default: (properties: FormProps) => {
    captured.form = properties;

    return null;
  },
}));
vi.mock("@/features/macroTracking/components/EntryHistoryPanel", () => ({
  default: (properties: PanelProps) => {
    captured.panel = properties;

    return <div>history</div>;
  },
}));

const entry = {
  id: 7,
  mealName: "Oatmeal",
  protein: 10,
  carbs: 40,
  fats: 5,
  mealType: "breakfast",
} as MacroEntry;

function errorMessages() {
  return useStore
    .getState()
    .notifications.filter((notification) => notification.type === "error")
    .map((notification) => notification.message);
}

describe("HomePage error notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutations.deleteState = { isPending: false, variables: undefined };
    useStore.setState({ notifications: [] });
    render(<HomePage />);
    expect(screen.getByText("history")).toBeInTheDocument();
  });

  it("shows an error when deleting an entry fails", async () => {
    mutations.delete.mockRejectedValue(new Error("Delete failed on server"));

    await act(() => captured.panel!.deleteEntry(entry.id));

    expect(errorMessages()).toEqual(["Delete failed on server"]);
  });

  it("shows the saved-meal limit error when starring an entry fails", async () => {
    mutations.createSavedMeal.mockRejectedValue(
      new Error("You've reached the limit of 10 saved meals on the Free plan."),
    );

    await act(() => captured.panel!.onSaveMeal(entry));

    expect(errorMessages()).toEqual([
      "You've reached the limit of 10 saved meals on the Free plan.",
    ]);
  });

  it("shows an error when the CSV export fails", async () => {
    vi.mocked(macrosApi.getAllHistory).mockRejectedValue(
      new Error("Export unavailable"),
    );

    await act(() => captured.panel!.onExportCsv());

    expect(errorMessages()).toEqual(["Export unavailable"]);
  });

  it("shows one error and rejects when adding an entry fails", async () => {
    mutations.add.mockRejectedValue(new Error("Add failed on server"));

    await act(async () => {
      await expect(captured.form!.onSubmit(entry)).rejects.toThrow(
        "Add failed on server",
      );
    });

    expect(errorMessages()).toEqual(["Add failed on server"]);
  });

  it("marks only the entry being deleted as deleting", () => {
    mutations.deleteState = { isPending: true, variables: 7 };
    render(<HomePage />);

    expect(captured.panel!.isDeleting(7)).toBe(true);
    expect(captured.panel!.isDeleting(8)).toBe(false);
  });
});

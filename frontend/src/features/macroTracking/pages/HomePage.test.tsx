import { act, fireEvent, render, screen } from "@testing-library/react";
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
  deleteEntry: (id: number, options?: { undoable?: boolean }) => Promise<void>;
  isDeleting: (id: number) => boolean;
  onSaveMeal: (entry: MacroEntry) => Promise<void>;
  onExportCsv: () => Promise<void>;
}
interface FormProps {
  onSubmit: (entry: unknown) => Promise<void>;
  defaultDate?: string;
}

const captured = vi.hoisted(() => ({
  panel: undefined as PanelProps | undefined,
  form: undefined as FormProps | undefined,
  summary: undefined as { date?: string } | undefined,
  history: [] as MacroEntry[],
  homeDate: {
    date: "2026-09-25",
    today: "2026-09-25",
    oldestDate: undefined as string | undefined,
    isToday: true,
  },
  navigate: vi.fn(),
  dailyTotals: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => captured.navigate,
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
  useMacroDailyTotals: (date: string) => {
    captured.dailyTotals(date);

    return { data: undefined };
  },
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
    history: captured.history,
    historyHasMore: false,
    isHistoryLoading: false,
    isLoadingMore: false,
    loadMoreHistory: vi.fn(),
    limits: undefined,
  }),
  useHomeDate: () => captured.homeDate,
  useHomeHeader: () => ({ title: "Home", subtitle: "" }),
  useNutritionProfile: () => undefined,
}));

vi.mock("@/components/layout/DashboardPageContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/layout/FeaturePage", () => ({
  default: ({
    children,
    headerChildren,
  }: {
    children: React.ReactNode;
    headerChildren?: React.ReactNode;
  }) => (
    <div>
      {headerChildren}
      {children}
    </div>
  ),
}));
vi.mock("@/components/metrics/UserMetricsPanel", () => ({ default: () => null }));
vi.mock("@/features/macroTracking/components/DailySummaryPanel", () => ({
  default: (properties: { date?: string }) => {
    captured.summary = properties;

    return null;
  },
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

const entry: MacroEntry = {
  id: 7,
  createdAt: "2026-09-20T08:00:00Z",
  mealName: "Oatmeal",
  protein: 10,
  carbs: 40,
  fats: 5,
  mealType: "breakfast",
  entryDate: "2026-09-20",
  entryTime: "08:15",
  ingredients: [{ name: "Oats", protein: 10, carbs: 40, fats: 5 }],
};

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
    captured.history = [entry];
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

  it("offers to undo a deleted entry and re-adds it from the snapshot", async () => {
    mutations.delete.mockResolvedValue({ success: true, id: entry.id });
    mutations.add.mockResolvedValue({ ...entry, id: 8 });

    await act(() => captured.panel!.deleteEntry(entry.id));

    const [notification] = useStore.getState().notifications;
    expect(notification).toMatchObject({
      message: "Entry deleted",
      action: { label: "Undo" },
    });

    await act(async () => {
      notification.action!.onClick();
    });

    expect(mutations.add).toHaveBeenCalledWith({
      protein: 10,
      carbs: 40,
      fats: 5,
      mealType: "breakfast",
      mealName: "Oatmeal",
      entryDate: "2026-09-20",
      entryTime: "08:15",
      ingredients: [{ name: "Oats", protein: 10, carbs: 40, fats: 5 }],
    });
  });

  it("does not offer undo when a whole day is deleted", async () => {
    mutations.delete.mockResolvedValue({ success: true, id: entry.id });

    await act(() => captured.panel!.deleteEntry(entry.id, { undoable: false }));

    expect(useStore.getState().notifications).toEqual([]);
  });
});

describe("HomePage selected day", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.history = [];
  });

  it("shows today by default", () => {
    captured.homeDate = {
      date: "2026-09-25",
      today: "2026-09-25",
      oldestDate: undefined,
      isToday: true,
    };
    render(<HomePage />);

    expect(captured.dailyTotals).toHaveBeenCalledWith("2026-09-25");
    expect(captured.summary!.date).toBeUndefined();
    expect(captured.form!.defaultDate).toBeUndefined();
  });

  it("shows and logs to the selected past day", () => {
    captured.homeDate = {
      date: "2026-09-20",
      today: "2026-09-25",
      oldestDate: undefined,
      isToday: false,
    };
    render(<HomePage />);

    expect(captured.dailyTotals).toHaveBeenCalledWith("2026-09-20");
    expect(captured.summary!.date).toBe("2026-09-20");
    expect(captured.form!.defaultDate).toBe("2026-09-20");
  });

  it("puts the day in the URL, and drops it for today", () => {
    captured.homeDate = {
      date: "2026-09-24",
      today: "2026-09-25",
      oldestDate: undefined,
      isToday: false,
    };
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    fireEvent.click(screen.getByRole("button", { name: "Next day" }));

    expect(captured.navigate.mock.calls).toEqual([
      [{ to: "/home", search: { date: "2026-09-23" }, replace: true }],
      [{ to: "/home", search: { date: undefined }, replace: true }],
    ]);
  });
});

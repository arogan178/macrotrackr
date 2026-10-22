import { QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";
import {
  closeEntryStore,
  getEntryStore,
} from "@/hooks/queries/macro/entryStore";
import { queryClient } from "@/lib/queryClient";
import { useStore } from "@/store/store";
import type { MacroEntry } from "@/types/macro";
import { addDaysISO, todayISO } from "@/utils/dateUtilities";

import HomePage from "./HomePage";

const homeDate = vi.hoisted(() => ({
  oldestDate: undefined as string | undefined,
}));

vi.mock("@/lib/queryClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/queryClient")>();

  return { ...actual, queryCachePersister: { removeClient: vi.fn() } };
});

vi.mock("@/api/macros", () => ({
  macrosApi: {
    getAllHistory: vi.fn(),
    addEntry: vi.fn(),
    replaceEntry: vi.fn(),
    deleteEntry: vi.fn(),
  },
}));

// jsdom has no IndexedDB; the outbox behaves the same on localStorage.
vi.mock("@tanstack/offline-transactions", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/offline-transactions")>();

  return { ...actual, IndexedDBAdapter: actual.LocalStorageAdapter };
});

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useUser: () => ({ data: { id: 1, firstName: "Test" }, dataUpdatedAt: 0 }),
}));
vi.mock("@/hooks/queries/useMacroQueries", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/queries/useMacroQueries")>();

  return {
    ...actual,
    useMacroDailyTotals: () => ({ data: undefined }),
    useMacroTargetQuery: () => ({ data: undefined }),
  };
});
// History comes from the real entry store, as the recent days do in the app.
vi.mock("@/features/macroTracking/hooks/useHomePage", async () => {
  const { useRecentMacroEntries } = await import(
    "@/hooks/queries/useMacroQueries"
  );
  const { todayISO: today } = await import("@/utils/dateUtilities");

  return {
    useHistoryPagination: () => ({
      history: useRecentMacroEntries().entries,
      historyHasMore: false,
      isHistoryLoading: false,
      isLoadingMore: false,
      loadMoreHistory: vi.fn(),
      limits: undefined,
    }),
    useHomeDate: () => ({
      date: today(),
      today: today(),
      oldestDate: homeDate.oldestDate,
      isToday: true,
    }),
    useHomeHeader: () => ({ title: "Home", subtitle: "" }),
    useNutritionProfile: () => undefined,
  };
});
vi.mock("@/hooks/queries/useSavedMeals", () => ({
  useCreateSavedMeal: () => ({ mutateAsync: vi.fn() }),
  useDeleteSavedMeal: () => ({ mutateAsync: vi.fn() }),
  useSavedMeals: () => ({ data: { meals: [] } }),
}));
vi.mock("@/hooks/queries/useGoals", () => ({
  useWeightGoals: () => ({ data: undefined }),
}));
vi.mock("@/hooks/usePageDataSync", () => ({ usePageDataSync: () => {} }));
vi.mock("@/components/billing/ProFeature", () => ({
  ProFeature: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/layout/DashboardPageContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/layout/FeaturePage", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/macroTracking/components/WeekStrip", () => ({
  default: () => null,
}));
vi.mock("@/features/macroTracking/components/DailySummaryPanel", () => ({
  default: () => null,
}));
vi.mock("@/features/macroTracking/components/AddEntryForm", () => ({
  default: () => null,
}));
vi.mock("@/features/macroTracking/components/EditModal", () => ({
  default: () => null,
}));

// One tab, so it always gets the lock that makes it the queue's only sender.
Object.defineProperty(navigator, "locks", {
  configurable: true,
  value: {
    request: (
      _name: string,
      _options: object,
      callback: (lock: object) => unknown,
    ) => Promise.resolve(callback({})),
  },
});

const today = todayISO();
const yesterday = addDaysISO(today, -1);

const riceBowl: MacroEntry = {
  id: 1,
  clientId: "entry-1",
  clientUpdatedAt: 1,
  createdAt: `${today} 12:31:00`,
  protein: 30,
  carbs: 40,
  fats: 10,
  mealType: "lunch",
  mealName: "Rice bowl",
  entryDate: today,
  entryTime: "12:30",
  ingredients: [
    { name: "Rice", protein: 30, carbs: 40, fats: 10, quantity: 200, unit: "g" },
  ],
};

const storedEntries = () =>
  getEntryStore(1).entries.toArray.map(
    ({ clientId, entryDate, mealType, mealName, protein, carbs, fats }) => ({
      clientId,
      entryDate,
      mealType,
      mealName,
      protein,
      carbs,
      fats,
    }),
  );

async function openCopyOrMove() {
  render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
  // Both layouts open the same actions sheet; the desktop row has the button.
  fireEvent.click(await screen.findByRole("button", { name: /^Actions for / }));
  fireEvent.click(screen.getByRole("button", { name: "Copy or move" }));

  return screen.getByRole("dialog", { name: "Copy or move entry" });
}

describe("copying and moving an entry", () => {
  beforeEach(() => {
    localStorage.clear();
    homeDate.oldestDate = undefined;
    if (!document.querySelector("#modal-root")) {
      const modalRoot = document.createElement("div");
      modalRoot.id = "modal-root";
      document.body.append(modalRoot);
    }
    useStore.setState({ showNotification: vi.fn() });
    vi.mocked(macrosApi.getAllHistory).mockResolvedValue({
      entries: [riceBowl],
    });
    vi.mocked(macrosApi.addEntry).mockImplementation(async (entry) => ({
      ...(entry as MacroEntry),
      id: 2,
      createdAt: `${today} 13:00:00`,
    }));
    vi.mocked(macrosApi.replaceEntry).mockImplementation(
      async (entry) => ({ ...riceBowl, ...entry }) as MacroEntry,
    );
  });

  afterEach(() => {
    // Unmount first, or a last render reopens the store for the next test.
    cleanup();
    closeEntryStore();
    queryClient.clear();
    vi.resetAllMocks();
  });

  it("copies an entry to today as another meal through the normal create path", async () => {
    const dialog = await openCopyOrMove();

    expect(within(dialog).getByLabelText("Date")).toHaveValue(today);
    expect(within(dialog).getByLabelText("Meal type")).toHaveValue("lunch");

    fireEvent.change(within(dialog).getByLabelText("Meal type"), {
      target: { value: "dinner" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Copy" }));

    await waitFor(() => expect(macrosApi.addEntry).toHaveBeenCalledTimes(1));
    const sent = vi.mocked(macrosApi.addEntry).mock.calls[0][0];
    expect(sent).toMatchObject({
      entryDate: today,
      entryTime: "12:30",
      mealType: "dinner",
      mealName: "Rice bowl",
      protein: 30,
      carbs: 40,
      fats: 10,
      ingredients: riceBowl.ingredients,
    });
    expect(sent.clientId).not.toBe("entry-1");
    expect(macrosApi.replaceEntry).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(
        storedEntries()
          .map((entry) => [entry.entryDate, entry.mealType, entry.mealName])
          .sort(),
      ).toEqual([
        [today, "dinner", "Rice bowl"],
        [today, "lunch", "Rice bowl"],
      ]),
    );
    expect(useStore.getState().showNotification).toHaveBeenCalledWith(
      "Copied to today",
      "success",
    );
  });

  it("moves an entry to yesterday by updating it, leaving no copy behind", async () => {
    const dialog = await openCopyOrMove();
    const move = within(dialog).getByRole("button", { name: "Move" });

    // Same day and meal: there is nothing to move.
    expect(move).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText("Date"), {
      target: { value: yesterday },
    });
    fireEvent.click(move);

    await waitFor(() =>
      expect(macrosApi.replaceEntry).toHaveBeenCalledTimes(1),
    );
    expect(vi.mocked(macrosApi.replaceEntry).mock.calls[0][0]).toMatchObject({
      clientId: "entry-1",
      entryDate: yesterday,
      mealType: "lunch",
      protein: 30,
      carbs: 40,
      fats: 10,
    });
    expect(macrosApi.addEntry).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(storedEntries()).toEqual([
        {
          clientId: "entry-1",
          entryDate: yesterday,
          mealType: "lunch",
          mealName: "Rice bowl",
          protein: 30,
          carbs: 40,
          fats: 10,
        },
      ]),
    );
  });

  it("will not copy or move into history the free plan hides", async () => {
    homeDate.oldestDate = addDaysISO(today, -7);
    const dialog = await openCopyOrMove();
    const date = within(dialog).getByLabelText("Date");

    expect(date).toHaveAttribute("min", homeDate.oldestDate);
    expect(date).toHaveAttribute("max", today);

    fireEvent.change(date, { target: { value: addDaysISO(today, -8) } });

    expect(within(dialog).getByRole("button", { name: "Copy" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Move" })).toBeDisabled();
    fireEvent.submit(date.closest("form") as HTMLFormElement);
    expect(macrosApi.addEntry).not.toHaveBeenCalled();
  });
});

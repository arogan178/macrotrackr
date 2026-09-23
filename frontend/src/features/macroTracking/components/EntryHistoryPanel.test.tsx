import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { openLogSheet } from "@/lib/logSheet";
import { todayISO } from "@/utils/dateUtilities";

import { formatEntryDate } from "./EntryHistoryHelpers";
import EntryHistoryPanel from "./EntryHistoryPanel";

vi.mock("@/lib/logSheet", () => ({ openLogSheet: vi.fn() }));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const setViewportIsDesktop = (matches: boolean) => {
  const matchMedia = globalThis.matchMedia;
  vi.spyOn(globalThis, "matchMedia").mockImplementation((query: string) =>
    query === "(min-width: 48rem)"
      ? { ...matchMedia(query), matches }
      : matchMedia(query),
  );
};

const renderEmptyPanel = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <EntryHistoryPanel
        history={[]}
        deleteEntry={() => {}}
        onEdit={() => {}}
        isDeleting={false}
        isEditing={false}
      />
    </QueryClientProvider>,
  );

describe("EntryHistoryPanel empty state", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(openLogSheet).mockClear();
  });

  it("opens the log sheet below md, where the inline form is hidden", () => {
    setViewportIsDesktop(false);
    renderEmptyPanel();

    fireEvent.click(screen.getByRole("button", { name: "Log a meal" }));

    expect(openLogSheet).toHaveBeenCalledTimes(1);
  });

  it("focuses the inline meal name input on desktop", () => {
    setViewportIsDesktop(true);
    const input = document.createElement("input");
    input.id = "meal-name-input";
    input.scrollIntoView = vi.fn();
    document.body.append(input);

    try {
      renderEmptyPanel();
      fireEvent.click(screen.getByRole("button", { name: "Log a meal" }));

      expect(openLogSheet).not.toHaveBeenCalled();
      expect(input).toHaveFocus();
    } finally {
      input.remove();
    }
  });
});

describe("EntryHistoryHelpers & Panel", () => {
  it("formatEntryDate formats ISO date accurately without UTC off-by-one shifts", () => {
    expect(formatEntryDate("2026-07-27")).toContain("27 Jul 2026");
  });

  it("renders today's entries without auto-collapsing", () => {
    const today = todayISO();
    const todayEntry = {
      id: 999,
      mealName: "Chicken & Rice",
      mealType: "lunch" as const,
      protein: 30,
      carbs: 40,
      fats: 10,
      entryDate: today,
      entryTime: "12:30",
      createdAt: new Date().toISOString(),
    };

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <EntryHistoryPanel
          history={[todayEntry]}
          deleteEntry={() => {}}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chicken & Rice").length).toBeGreaterThan(0);
  });

  it("updates entry list dynamically when history prop changes without closing date tab", async () => {
    const today = todayISO();
    const entry1 = {
      id: 101,
      mealName: "Oatmeal",
      mealType: "breakfast" as const,
      protein: 15,
      carbs: 50,
      fats: 5,
      entryDate: today,
      entryTime: "08:00",
      createdAt: new Date().toISOString(),
    };

    const entry2 = {
      id: 102,
      mealName: "Salmon Salad",
      mealType: "lunch" as const,
      protein: 35,
      carbs: 10,
      fats: 20,
      entryDate: today,
      entryTime: "12:00",
      createdAt: new Date().toISOString(),
    };

    const queryClient = createQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <EntryHistoryPanel
          history={[entry1]}
          deleteEntry={() => {}}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Oatmeal").length).toBeGreaterThan(0);
    expect(screen.queryByText("Salmon Salad")).toBeNull();

    // Rerender with added entry
    rerender(
      <QueryClientProvider client={queryClient}>
        <EntryHistoryPanel
          history={[entry1, entry2]}
          deleteEntry={() => {}}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Salmon Salad").length).toBeGreaterThan(0);

    // Rerender with deleted entry
    rerender(
      <QueryClientProvider client={queryClient}>
        <EntryHistoryPanel
          history={[entry2]}
          deleteEntry={() => {}}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Oatmeal")).toBeNull();
    });
    expect(screen.getAllByText("Salmon Salad").length).toBeGreaterThan(0);
  });

  it("maintains entry rendering when transitioning from optimistic temp ID to server ID with stable clientId", () => {
    const today = todayISO();
    const optimisticEntry = {
      id: -12345,
      clientId: "client_temp_123",
      mealName: "Protein Shake",
      mealType: "snack" as const,
      protein: 25,
      carbs: 5,
      fats: 2,
      entryDate: today,
      entryTime: "15:00",
      createdAt: new Date().toISOString(),
    };

    const serverEntry = {
      ...optimisticEntry,
      id: 555, // server assigned ID
    };

    const queryClient = createQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <EntryHistoryPanel
          history={[optimisticEntry]}
          deleteEntry={() => {}}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Protein Shake").length).toBeGreaterThan(0);

    // Transition from optimistic entry to persisted server entry
    rerender(
      <QueryClientProvider client={queryClient}>
        <EntryHistoryPanel
          history={[serverEntry]}
          deleteEntry={() => {}}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Protein Shake").length).toBeGreaterThan(0);
  });

  it("renders Load More Dates button and triggers onLoadMore when hasMore is true even if currently loaded dates count < 5", async () => {
    const queryClient = createQueryClient();
    let loadMoreCalled = false;

    // Create entries for 2 distinct dates (fewer than displayedDateCount default of 5)
    const entries = [
      {
        id: 1,
        mealName: "Meal 1",
        mealType: "lunch" as const,
        protein: 20,
        carbs: 30,
        fats: 10,
        entryDate: "2026-07-31",
        entryTime: "12:00",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        mealName: "Meal 2",
        mealType: "dinner" as const,
        protein: 25,
        carbs: 35,
        fats: 12,
        entryDate: "2026-07-30",
        entryTime: "19:00",
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <QueryClientProvider client={queryClient}>
        <EntryHistoryPanel
          history={entries}
          deleteEntry={() => {}}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
          hasMore
          onLoadMore={() => {
            loadMoreCalled = true;
          }}
        />
      </QueryClientProvider>,
    );

    const loadMoreButton = screen.getByRole("button", { name: /load more dates/i });
    expect(loadMoreButton).toBeDefined();

    loadMoreButton.click();
    await waitFor(() => {
      expect(loadMoreCalled).toBe(true);
    });
  });

  it("deletes a whole day without offering undo per entry", async () => {
    const today = todayISO();
    const deleteEntry = vi.fn();
    const modalRoot = document.createElement("div");
    modalRoot.setAttribute("id", "modal-root");
    document.body.append(modalRoot);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <EntryHistoryPanel
          history={[
            {
              id: 41,
              mealName: "Toast",
              mealType: "breakfast",
              protein: 5,
              carbs: 20,
              fats: 2,
              entryDate: today,
              entryTime: "08:00",
              createdAt: new Date().toISOString(),
            },
          ]}
          deleteEntry={deleteEntry}
          onEdit={() => {}}
          isDeleting={() => false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getAllByLabelText("Delete all entries for Today")[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Delete All" }));

    expect(deleteEntry).toHaveBeenCalledWith(41, { undoable: false });
  });
});

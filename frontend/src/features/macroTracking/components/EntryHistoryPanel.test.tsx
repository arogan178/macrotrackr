import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { todayISO } from "@/utils/dateUtilities";

import { formatEntryDate } from "./EntryHistoryHelpers";
import EntryHistoryPanel from "./EntryHistoryPanel";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
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
          isDeleting={false}
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
          isDeleting={false}
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
          isDeleting={false}
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
          isDeleting={false}
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
          isDeleting={false}
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
          isDeleting={false}
          isEditing={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText("Protein Shake").length).toBeGreaterThan(0);
  });
});

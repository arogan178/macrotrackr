import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import EntryHistoryPanel from "./EntryHistoryPanel";
import { formatEntryDate } from "./EntryHistoryHelpers";
import { todayISO } from "@/utils/dateUtilities";

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
});

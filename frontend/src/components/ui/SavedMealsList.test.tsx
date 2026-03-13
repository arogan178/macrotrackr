import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SavedMealsList from "./SavedMealsList";

vi.mock("@/hooks/queries/useSavedMeals", () => ({
  useSavedMeals: () => ({ data: [], isLoading: false }),
  useDeleteSavedMeal: () => ({ mutate: vi.fn() }),
}));

describe("SavedMealsList", () => {
  it("renders without crashing", () => {
    render(<SavedMealsList onSelectMeal={() => {}} />);
  });

  it("shows empty state when no meals", () => {
    render(<SavedMealsList onSelectMeal={() => {}} />);
    expect(screen.getByText(/no saved meals/i)).toBeDefined();
  });
});

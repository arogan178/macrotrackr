import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";

import { useFoodSearch } from "./useFoodSearch";

vi.mock("@/api/macros", () => ({
  macrosApi: {
    search: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("useFoodSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls macrosApi.search with the expected payload", async () => {
    (macrosApi.search as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        name: "Chicken Breast",
        protein: 31,
        carbs: 0,
        fats: 3.6,
        energyKcal: 165,
        categories: "Meat",
        servingQuantity: 100,
        servingUnit: "g",
      },
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFoodSearch("chicken"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(macrosApi.search).toHaveBeenCalledWith({ query: "chicken" });
  });

  it("does not call macrosApi.search for short queries", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFoodSearch("a"), { wrapper });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    expect(macrosApi.search).not.toHaveBeenCalled();
  });
});

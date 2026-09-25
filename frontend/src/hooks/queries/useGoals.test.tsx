import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { goalsApi, type WeightLogEntry } from "@/api/goals";
import { queryKeys } from "@/lib/queryKeys";

import { useUpdateWeightLogEntry } from "./useGoals";

vi.mock("@/api/goals", () => ({
  goalsApi: { updateWeightLogEntry: vi.fn() },
}));

vi.mock("@/hooks/useRealtimeSync", () => ({
  broadcastLocalDataChange: vi.fn(),
}));

const log: WeightLogEntry[] = [
  { id: "a", timestamp: "2026-09-01T08:00:00.000Z", weight: 82 },
  { id: "b", timestamp: "2026-09-20T08:00:00.000Z", weight: 78 },
];

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(queryKeys.goals.weightLog(), log);
  const { result } = renderHook(() => useUpdateWeightLogEntry(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { queryClient, result };
}

describe("useUpdateWeightLogEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the edit before the server answers", async () => {
    let resolveUpdate: (entry: WeightLogEntry) => void = () => {};
    vi.mocked(goalsApi.updateWeightLogEntry).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const { queryClient, result } = setup();
    const edited = { ...log[1], weight: 77.5 };

    let mutation: Promise<unknown> = Promise.resolve();
    act(() => {
      mutation = result.current.mutateAsync(edited);
    });

    await vi.waitFor(() =>
      expect(queryClient.getQueryData(queryKeys.goals.weightLog())).toEqual([
        log[0],
        edited,
      ]),
    );

    resolveUpdate(edited);
    await act(() => mutation);
  });

  it("puts the entry back when the server refuses", async () => {
    vi.mocked(goalsApi.updateWeightLogEntry).mockRejectedValue(
      new Error("nope"),
    );
    const { queryClient, result } = setup();

    await act(async () => {
      await result.current
        .mutateAsync({ ...log[1], weight: 60 })
        .catch(() => {});
    });

    expect(queryClient.getQueryData(queryKeys.goals.weightLog())).toEqual(log);
  });
});

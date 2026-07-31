import { createElement,ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { broadcastLocalDataChange, useRealtimeSync } from "./useRealtimeSync";

describe("useRealtimeSync", () => {
  it("broadcasts local data changes without error", () => {
    expect(() => broadcastLocalDataChange("macros")).not.toThrow();
  });

  it("mounts real-time sync hook cleanly when authenticated", () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { unmount } = renderHook(() => useRealtimeSync(true), { wrapper });
    expect(unmount).not.toThrow();
  });

  it("mounts real-time sync hook cleanly when unauthenticated", () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { unmount } = renderHook(() => useRealtimeSync(false), { wrapper });
    expect(unmount).not.toThrow();
  });
});

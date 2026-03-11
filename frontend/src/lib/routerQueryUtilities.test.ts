import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { ensureQueryData, prefetchQuery } from "./routerQueryUtilities";

describe("routerQueryUtilities", () => {
  describe("ensureQueryData", () => {
    it("ensures query data is available", async () => {
      const queryClient = new QueryClient();
      const queryKey = ["test"];
      const queryFunction = vi.fn().mockResolvedValue({ data: "test" });

      const result = await ensureQueryData(queryClient, queryKey, queryFunction);
      expect(result).toEqual({ data: "test" });
      expect(queryFunction).toHaveBeenCalled();
    });

    it("passes options to ensureQueryData", async () => {
      const queryClient = new QueryClient();
      const queryKey = ["test"];
      const queryFunction = vi.fn().mockResolvedValue({ data: "test" });

      await ensureQueryData(queryClient, queryKey, queryFunction, {
        staleTime: 1000,
      });

      const cached = queryClient.getQueryData(queryKey);
      expect(cached).toEqual({ data: "test" });
    });
  });

  describe("prefetchQuery", () => {
    it("preetches query without waiting", async () => {
      const queryClient = new QueryClient();
      const queryKey = ["prefetch"];
      const queryFunction = vi.fn().mockResolvedValue({ prefetched: true });

      await prefetchQuery(queryClient, queryKey, queryFunction);

      expect(queryFunction).toHaveBeenCalled();
    });
  });
});

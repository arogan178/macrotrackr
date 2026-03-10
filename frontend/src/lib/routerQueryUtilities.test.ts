import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { ensureQueryData, prefetchQuery } from "./routerQueryUtilities";

describe("routerQueryUtilities", () => {
  describe("ensureQueryData", () => {
    it("ensures query data is available", async () => {
      const queryClient = new QueryClient();
      const queryKey = ["test"];
      const queryFn = vi.fn().mockResolvedValue({ data: "test" });

      const result = await ensureQueryData(queryClient, queryKey, queryFn);
      expect(result).toEqual({ data: "test" });
      expect(queryFn).toHaveBeenCalled();
    });

    it("passes options to ensureQueryData", async () => {
      const queryClient = new QueryClient();
      const queryKey = ["test"];
      const queryFn = vi.fn().mockResolvedValue({ data: "test" });

      await ensureQueryData(queryClient, queryKey, queryFn, {
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
      const queryFn = vi.fn().mockResolvedValue({ prefetched: true });

      await prefetchQuery(queryClient, queryKey, queryFn);

      expect(queryFn).toHaveBeenCalled();
    });
  });
});

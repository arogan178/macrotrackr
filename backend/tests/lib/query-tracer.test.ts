import { describe, expect, it, beforeEach, vi } from "vitest";

// Mock the logger module before importing the module under test
vi.mock("../../src/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  traceQuery,
  traceQuerySync,
  getRecentTraces,
  getSlowQueryStats,
  clearTraces,
} from "../../src/lib/query-tracer";

describe("query-tracer", () => {
  beforeEach(() => {
    clearTraces();
    vi.useFakeTimers();
  });

  describe("traceQuerySync", () => {
    it("traces a fast query with ok threshold", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00"));

      const result = traceQuerySync("SELECT * FROM users", ["param1"], () => {
        return "test result";
      });

      expect(result).toBe("test result");
      const traces = getRecentTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0]!.query).toBe("SELECT * FROM users");
      expect(traces[0]!.threshold).toBe("ok");
    });

    it("traces a slow query with warning threshold", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00"));

      const result = traceQuerySync("SELECT * FROM users", [], () => {
        // Simulate slow query
        vi.advanceTimersByTime(150);
        return "slow result";
      });

      expect(result).toBe("slow result");
      const traces = getRecentTraces();
      expect(traces[0]!.threshold).toBe("warning");
    });

    it("traces a critical query with critical threshold", () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00"));

      const result = traceQuerySync("SELECT * FROM users", [], () => {
        // Simulate critical slow query
        vi.advanceTimersByTime(600);
        return "critical result";
      });

      expect(result).toBe("critical result");
      const traces = getRecentTraces();
      expect(traces[0]!.threshold).toBe("critical");
    });

    it("truncates long queries", () => {
      const longQuery = "SELECT " + "a".repeat(300);
      traceQuerySync(longQuery, [], () => "result");

      const traces = getRecentTraces();
      expect(traces[0]!.query.length).toBeLessThanOrEqual(200);
    });

    it("limits params to 10", () => {
      const params = Array.from({ length: 15 }, (_, i) => `param${i}`);
      traceQuerySync("SELECT", params, () => "result");

      const traces = getRecentTraces();
      expect(traces[0]!.params).toHaveLength(10);
    });
  });

  describe("traceQuery (async)", () => {
    it("traces async query", async () => {
      vi.setSystemTime(new Date("2025-01-01T00:00:00"));

      const result = await traceQuery("SELECT * FROM users", [], async () => {
        return "async result";
      });

      expect(result).toBe("async result");
      const traces = getRecentTraces();
      expect(traces).toHaveLength(1);
    });
  });

  describe("getSlowQueryStats", () => {
    it("returns empty stats when no traces", () => {
      const stats = getSlowQueryStats();
      expect(stats.totalQueries).toBe(0);
      expect(stats.slowQueries).toBe(0);
      expect(stats.criticalQueries).toBe(0);
    });

    it("calculates stats correctly", () => {
      // Add some traces manually
      traceQuerySync("SELECT 1", [], () => {
        vi.advanceTimersByTime(50);
        return "";
      });
      traceQuerySync("SELECT 2", [], () => {
        vi.advanceTimersByTime(150);
        return "slow";
      });
      traceQuerySync("SELECT 3", [], () => {
        vi.advanceTimersByTime(600);
        return "critical";
      });

      const stats = getSlowQueryStats();
      expect(stats.totalQueries).toBe(3);
      expect(stats.slowQueries).toBe(1);
      expect(stats.criticalQueries).toBe(1);
    });
  });

  describe("clearTraces", () => {
    it("clears all traces", () => {
      traceQuerySync("SELECT 1", [], () => "result");
      expect(getRecentTraces()).toHaveLength(1);

      clearTraces();
      expect(getRecentTraces()).toHaveLength(0);
    });
  });
});

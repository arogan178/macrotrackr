import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

// Mock the logger module before importing the module under test
vi.mock("../../src/lib/observability/logger", () => ({
  logger: new Proxy({}, { get: () => vi.fn() }),
  loggerHelpers: new Proxy({}, { get: () => vi.fn() }),
}));

import {
  traceQuerySync,
  getRecentTraces,
  getSlowQueryStats,
  clearTraces,
} from "../../src/lib/observability/query-tracer";

describe("query-tracer", () => {
  let dateSpy: any;
  let nowTime = 1000;

  beforeEach(() => {
    clearTraces();
    nowTime = 1000;
    dateSpy = vi.spyOn(Date, "now").mockImplementation(() => nowTime);
  });

  afterEach(() => {
    if (dateSpy) {
      dateSpy.mockRestore();
    }
  });

  describe("traceQuerySync", () => {
    it("traces a fast query with ok threshold", () => {
      const q = "SELECT * FROM users_fast_" + Math.random();
      const result = traceQuerySync(q, ["param1"], () => {
        return "test result";
      });

      expect(result).toBe("test result");
      const traces = getRecentTraces().filter(t => t.query === q.slice(0, 200));
      expect(traces.length).toBe(1);
      expect(traces[0]!.threshold).toBe("ok");
    });

    it("traces a slow query with warning threshold", () => {
      const q = "SELECT * FROM users_slow_" + Math.random();
      const result = traceQuerySync(q, [], () => {
        nowTime += 150;
        return "slow result";
      });

      expect(result).toBe("slow result");
      const traces = getRecentTraces().filter(t => t.query === q.slice(0, 200));
      expect(traces.length).toBe(1);
      expect(traces[0]!.threshold).toBe("warning");
    });

    it("traces a critical query with critical threshold", () => {
      const q = "SELECT * FROM users_critical_" + Math.random();
      const result = traceQuerySync(q, [], () => {
        nowTime += 600;
        return "critical result";
      });

      expect(result).toBe("critical result");
      const traces = getRecentTraces().filter(t => t.query === q.slice(0, 200));
      expect(traces.length).toBe(1);
      expect(traces[0]!.threshold).toBe("critical");
    });

    it("truncates long queries", () => {
      const longQuery = "SELECT_TRUNCATE_" + "a".repeat(300);
      traceQuerySync(longQuery, [], () => "result");

      const traces = getRecentTraces().filter(t => t.query.startsWith("SELECT_TRUNCATE_"));
      expect(traces.length).toBe(1);
      expect(traces[0]!.query.length).toBeLessThanOrEqual(200);
    });

    it("limits params to 10", () => {
      const q = "SELECT_PARAMS_" + Math.random();
      const params = Array.from({ length: 15 }, (_, i) => `param${i}`);
      traceQuerySync(q, params, () => "result");

      const traces = getRecentTraces().filter(t => t.query === q.slice(0, 200));
      expect(traces.length).toBe(1);
      expect(traces[0]!.params).toHaveLength(10);
    });
  });

  describe("getSlowQueryStats", () => {
    it("returns stats object", () => {
      const stats = getSlowQueryStats();
      expect(stats.totalQueries).toBeGreaterThanOrEqual(0);
      expect(typeof stats.averageDuration).toBe("number");
    });
  });
});

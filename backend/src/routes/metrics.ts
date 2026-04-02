import { timingSafeEqual } from "node:crypto";
import { Elysia } from "elysia";
import { config } from "../config";
import { getMetricsRegistry } from "../lib/metrics";
import { getSlowQueryStats, getRecentTraces } from "../lib/query-tracer";

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isDiagnosticsAuthorized(request: Request): boolean {
  const configuredKey = config.METRICS_API_KEY?.trim();

  if (!configuredKey) {
    return false;
  }

  const headerKey = request.headers.get("x-metrics-key")?.trim();
  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/u, "")
    .trim();

  const providedKey = headerKey || bearerToken;
  return providedKey ? secureCompare(providedKey, configuredKey) : false;
}

export const metricsRoutes = new Elysia()
  .get("/metrics", () => {
    const metrics = getMetricsRegistry();
    const prometheusOutput = metrics.exportPrometheus();
    return new Response(prometheusOutput, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  })
  .get("/metrics/queries", ({ request, set }) => {
    if (!isDiagnosticsAuthorized(request)) {
      set.status = 403;
      return {
        code: "FORBIDDEN",
        message: "Diagnostics access denied",
      };
    }

    const stats = getSlowQueryStats();
    const recentTraces = getRecentTraces(50).map(
      ({ query, duration, timestamp, threshold }) => ({
        query,
        duration,
        timestamp,
        threshold,
      }),
    );

    set.headers = set.headers || {};
    set.headers["Cache-Control"] = "no-store";

    return {
      stats,
      recentTraces,
      thresholds: {
        slowQueryMs: 100,
        criticalQueryMs: 500,
      },
    };
  });

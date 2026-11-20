/**
 * Query performance tracer for identifying slow queries
 */

import { logger } from "./logger";

export interface QueryTrace {
  query: string;
  duration: number;
  timestamp: Date;
  params?: unknown[];
  threshold: "ok" | "warning" | "critical";
}

const SLOW_QUERY_THRESHOLD_MS = 100;
const CRITICAL_QUERY_THRESHOLD_MS = 500;
const MAX_TRACES = 1000;

// Fixed-size ring buffer avoids O(N) array shifts on every SQL query.
const traceRing: Array<QueryTrace | undefined> = new Array(MAX_TRACES);
let traceHead = 0;
let traceCount = 0;

function orderedTraces(): QueryTrace[] {
  const result: QueryTrace[] = new Array(traceCount);
  const start = traceCount < MAX_TRACES ? 0 : traceHead;
  for (let i = 0; i < traceCount; i++) {
    result[i] = traceRing[(start + i) % MAX_TRACES]!;
  }
  return result;
}

/**
 * Synchronous version of traceQuery for synchronous database operations
 */
export function traceQuerySync<T>(
  query: string,
  params: unknown[] | undefined,
  fn: () => T,
): T {
  const start = Date.now();

  try {
    return fn();
  } finally {
    const duration = Date.now() - start;
    const threshold =
      duration >= CRITICAL_QUERY_THRESHOLD_MS
        ? "critical"
        : duration >= SLOW_QUERY_THRESHOLD_MS
          ? "warning"
          : "ok";

    const trace: QueryTrace = {
      query: query.substring(0, 200),
      duration,
      timestamp: new Date(),
      params: params?.slice(0, 10),
      threshold,
    };

    traceRing[traceHead] = trace;
    traceHead = (traceHead + 1) % MAX_TRACES;
    if (traceCount < MAX_TRACES) {
      traceCount++;
    }

    if (threshold === "critical") {
      logger.error(
        { query: trace.query, params: trace.params },
        `CRITICAL SLOW QUERY (${duration}ms)`,
      );
    } else if (threshold === "warning") {
      logger.warn(
        { query: trace.query, params: trace.params },
        `SLOW QUERY (${duration}ms)`,
      );
    }
  }
}

export function getRecentTraces(limit = 100): QueryTrace[] {
  const traces = orderedTraces();
  return traces.slice(-limit);
}

export function clearTraces(): void {
  traceRing.fill(undefined);
  traceHead = 0;
  traceCount = 0;
}

export function getSlowQueryStats(): {
  totalQueries: number;
  slowQueries: number;
  criticalQueries: number;
  averageDuration: number;
  p95Duration: number;
} {
  const traces = orderedTraces();
  const total = traces.length;
  let slow = 0;
  let critical = 0;
  let sum = 0;
  const durations = new Array<number>(total);

  for (let i = 0; i < total; i++) {
    const trace = traces[i]!;
    if (trace.threshold === "warning") slow++;
    else if (trace.threshold === "critical") critical++;
    sum += trace.duration;
    durations[i] = trace.duration;
  }

  durations.sort((a, b) => a - b);
  const avg = total > 0 ? sum / total : 0;
  const p95Index = Math.floor(total * 0.95);
  const p95 = durations[p95Index] ?? 0;

  return {
    totalQueries: total,
    slowQueries: slow,
    criticalQueries: critical,
    averageDuration: Math.round(avg),
    p95Duration: p95,
  };
}

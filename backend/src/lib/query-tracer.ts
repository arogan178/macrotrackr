/**
 * Query performance tracer for identifying slow queries
 */

import { logger } from './logger';

export interface QueryTrace {
  query: string;
  duration: number;
  timestamp: Date;
  params?: unknown[];
  threshold: 'ok' | 'warning' | 'critical';
}

const SLOW_QUERY_THRESHOLD_MS = 100;
const CRITICAL_QUERY_THRESHOLD_MS = 500;

// Store recent query traces for analysis (in-memory, limited size)
const recentTraces: QueryTrace[] = [];
const MAX_TRACES = 1000;

export function traceQuery<T>(
  query: string,
  params: unknown[] | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  return fn().finally(() => {
    const duration = Date.now() - start;
    const threshold = duration >= CRITICAL_QUERY_THRESHOLD_MS
      ? 'critical'
      : duration >= SLOW_QUERY_THRESHOLD_MS
        ? 'warning'
        : 'ok';
    
    const trace: QueryTrace = {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: new Date(),
      params: params?.slice(0, 10), // Limit params
      threshold,
    };
    
    // Store trace
    recentTraces.push(trace);
    if (recentTraces.length > MAX_TRACES) {
      recentTraces.shift();
    }
    
    // Log slow queries
    if (threshold === 'critical') {
      logger.error({ query: trace.query, params: trace.params }, `CRITICAL SLOW QUERY (${duration}ms)`);
    } else if (threshold === 'warning') {
      logger.warn({ query: trace.query, params: trace.params }, `SLOW QUERY (${duration}ms)`);
    }
  });
}

/**
 * Synchronous version of traceQuery for synchronous database operations
 */
export function traceQuerySync<T>(
  query: string,
  params: unknown[] | undefined,
  fn: () => T
): T {
  const start = Date.now();
  
  try {
    return fn();
  } finally {
    const duration = Date.now() - start;
    const threshold = duration >= CRITICAL_QUERY_THRESHOLD_MS
      ? 'critical'
      : duration >= SLOW_QUERY_THRESHOLD_MS
        ? 'warning'
        : 'ok';
    
    const trace: QueryTrace = {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: new Date(),
      params: params?.slice(0, 10), // Limit params
      threshold,
    };
    
    // Store trace
    recentTraces.push(trace);
    if (recentTraces.length > MAX_TRACES) {
      recentTraces.shift();
    }
    
    // Log slow queries
    if (threshold === 'critical') {
      logger.error({ query: trace.query, params: trace.params }, `CRITICAL SLOW QUERY (${duration}ms)`);
    } else if (threshold === 'warning') {
      logger.warn({ query: trace.query, params: trace.params }, `SLOW QUERY (${duration}ms)`);
    }
  }
}

export function getRecentTraces(limit = 100): QueryTrace[] {
  return recentTraces.slice(-limit);
}

export function getSlowQueryStats(): {
  totalQueries: number;
  slowQueries: number;
  criticalQueries: number;
  averageDuration: number;
  p95Duration: number;
} {
  const total = recentTraces.length;
  const slow = recentTraces.filter(t => t.threshold === 'warning').length;
  const critical = recentTraces.filter(t => t.threshold === 'critical').length;
  
  const durations = recentTraces.map(t => t.duration).sort((a, b) => a - b);
  const avg = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;
  const p95Index = Math.floor(durations.length * 0.95);
  const p95 = durations[p95Index] ?? 0;
  
  return {
    totalQueries: total,
    slowQueries: slow,
    criticalQueries: critical,
    averageDuration: Math.round(avg),
    p95Duration: p95,
  };
}

export function clearTraces(): void {
  recentTraces.length = 0;
}

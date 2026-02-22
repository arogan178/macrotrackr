import { Elysia } from 'elysia';
import { metrics } from '../lib/metrics';
import { getSlowQueryStats, getRecentTraces } from '../lib/query-tracer';

export const metricsRoutes = new Elysia()
  .get('/metrics', () => {
    const prometheusOutput = metrics.exportPrometheus();
    return new Response(prometheusOutput, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  })
  .get('/metrics/queries', () => {
    const stats = getSlowQueryStats();
    const recentTraces = getRecentTraces(50);
    
    return {
      stats,
      recentTraces,
      thresholds: {
        slowQueryMs: 100,
        criticalQueryMs: 500
      }
    };
  });

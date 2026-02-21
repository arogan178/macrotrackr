import { Elysia } from 'elysia';
import { metrics } from '../lib/metrics';

export const metricsRoutes = new Elysia()
  .get('/metrics', () => {
    const prometheusOutput = metrics.exportPrometheus();
    return new Response(prometheusOutput, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  });

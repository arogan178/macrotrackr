/**
 * Metrics collection for SLO tracking
 * Provides Prometheus-compatible metrics for monitoring
 */

import { logger } from "./logger";

interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface Metric {
  name: string;
  help: string;
  type: "counter" | "gauge" | "histogram";
  values: MetricValue[];
}

export class MetricsRegistry {
  private metrics: Map<string, Metric> = new Map();

  registerCounter(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: "counter", values: [] });
  }

  registerGauge(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: "gauge", values: [] });
  }

  registerHistogram(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: "histogram", values: [] });
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (metric?.type === "counter") {
      const existing = metric.values.find((v) =>
        JSON.stringify(v.labels) === JSON.stringify(labels)
      );
      if (existing) {
        existing.value++;
        existing.timestamp = Date.now();
      } else {
        metric.values.push({ value: 1, timestamp: Date.now(), labels });
      }
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (metric?.type === "gauge") {
      const existing = metric.values.find((v) =>
        JSON.stringify(v.labels) === JSON.stringify(labels)
      );
      if (existing) {
        existing.value = value;
        existing.timestamp = Date.now();
      } else {
        metric.values.push({ value, timestamp: Date.now(), labels });
      }
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (metric?.type === "histogram") {
      metric.values.push({ value, timestamp: Date.now(), labels });
    }
  }

  exportPrometheus(): string {
    const lines: string[] = [];
    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      for (const v of metric.values) {
        const labelStr = v.labels
          ? `{${Object.entries(v.labels)
              .map(([k, value]) => `${k}="${value}"`)
              .join(",")}}`
          : "";
        lines.push(`${metric.name}${labelStr} ${v.value}`);
      }
    }
    return lines.join("\n");
  }
}

function registerDefaultMetrics(metrics: MetricsRegistry) {
  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerCounter("http_requests_errors", "Total HTTP errors");
  metrics.registerCounter("auth_attempts_total", "Total authentication attempts");
  metrics.registerCounter("auth_failures_total", "Total authentication failures");
  metrics.registerCounter("webhook_deliveries_total", "Total webhook deliveries");
  metrics.registerCounter("webhook_failures_total", "Total webhook failures");
  metrics.registerHistogram(
    "http_request_duration_ms",
    "HTTP request duration in milliseconds",
  );
  metrics.registerGauge(
    "health_check_status",
    "Health check status (1=healthy, 0=unhealthy)",
  );
}

export function createMetricsRegistry() {
  const metrics = new MetricsRegistry();
  registerDefaultMetrics(metrics);
  return metrics;
}

let metricsRef: MetricsRegistry | null = null;
let metricsConfiguredExplicitly = false;

export function configureMetricsRegistry(metrics: MetricsRegistry) {
  metricsRef = metrics;
  metricsConfiguredExplicitly = true;
}

export function getMetricsRegistry() {
  if (!metricsRef) {
    if (!metricsConfiguredExplicitly) {
      logger.warn(
        {
          type: "implicit_service_initialization",
          service: "metrics",
        },
        "Metrics registry accessed before explicit runtime configuration; using default instance.",
      );
    }

    metricsRef = createMetricsRegistry();
  }

  return metricsRef;
}

export function resetMetricsRegistry() {
  metricsRef = null;
  metricsConfiguredExplicitly = false;
}

// Helper functions
export function recordRequest(method: string, path: string, status: number, durationMs: number): void {
  const metrics = getMetricsRegistry();
  metrics.incrementCounter("http_requests_total", {
    method,
    path,
    status: String(status),
  });
  
  if (status >= 500) {
    metrics.incrementCounter("http_requests_errors", {
      method,
      path,
      status: String(status),
    });
  }
  
  metrics.observeHistogram("http_request_duration_ms", durationMs, {
    method,
    path,
  });
}

export function recordAuthAttempt(success: boolean): void {
  const metrics = getMetricsRegistry();
  metrics.incrementCounter("auth_attempts_total");
  if (!success) {
    metrics.incrementCounter("auth_failures_total");
  }
}

export function recordWebhookDelivery(success: boolean, type: string): void {
  const metrics = getMetricsRegistry();
  metrics.incrementCounter("webhook_deliveries_total", { type });
  if (!success) {
    metrics.incrementCounter("webhook_failures_total", { type });
  }
}

export function setHealthStatus(service: string, healthy: boolean): void {
  const metrics = getMetricsRegistry();
  metrics.setGauge("health_check_status", healthy ? 1 : 0, { service });
}

/**
 * Metrics collection for SLO tracking.
 * Provides Prometheus-compatible metrics with bounded label cardinality
 * and pre-aggregated histogram buckets.
 */

import { logger } from "./logger";

const HISTOGRAM_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000] as const;

interface ScalarEntry {
  value: number;
  labels?: Record<string, string>;
}

interface HistogramEntry {
  buckets: number[];
  sum: number;
  count: number;
  labels?: Record<string, string>;
}

interface ScalarMetric {
  name: string;
  help: string;
  type: "counter" | "gauge";
  entries: Map<string, ScalarEntry>;
}

interface HistogramMetric {
  name: string;
  help: string;
  type: "histogram";
  entries: Map<string, HistogramEntry>;
}

type Metric = ScalarMetric | HistogramMetric;

function labelKey(labels?: Record<string, string>): string {
  if (!labels) return "";
  const keys = Object.keys(labels).sort();
  return keys.map((k) => `${k}=${labels[k]}`).join("|");
}

function formatLabels(
  labels?: Record<string, string>,
  extra?: Record<string, string>,
): string {
  const entries = [
    ...(labels ? Object.entries(labels) : []),
    ...(extra ? Object.entries(extra) : []),
  ];
  if (entries.length === 0) return "";
  return `{${entries
    .map(([k, v]) => `${k}="${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(",")}}`;
}

/**
 * Collapse dynamic path segments (IDs, UUIDs, barcodes, webhook secrets)
 * so Prometheus label cardinality stays bounded.
 */
export function normalizeMetricPath(path: string): string {
  return path
    .replace(/\/api\/billing\/play\/rtdn\/[^/]+/, "/api/billing/play/rtdn/:secret")
    .replace(/\/by-client-id\/[^/]+/, "/by-client-id/:clientId")
    .replace(/\/barcode\/[^/]+/, "/barcode/:barcode")
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi,
      "/:uuid",
    )
    .replace(/\/(?:wl|hb|sm)_[A-Za-z0-9_-]+(?=\/|$)/g, "/:id")
    .replace(/\/\d+(?=\/|$)/g, "/:id");
}

export class MetricsRegistry {
  private metrics: Map<string, Metric> = new Map();

  registerCounter(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: "counter", entries: new Map() });
  }

  registerGauge(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: "gauge", entries: new Map() });
  }

  registerHistogram(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: "histogram", entries: new Map() });
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (metric?.type !== "counter") return;
    const key = labelKey(labels);
    const existing = metric.entries.get(key);
    if (existing) {
      existing.value++;
    } else {
      metric.entries.set(key, { value: 1, labels });
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (metric?.type !== "gauge") return;
    const key = labelKey(labels);
    const existing = metric.entries.get(key);
    if (existing) {
      existing.value = value;
    } else {
      metric.entries.set(key, { value, labels });
    }
  }

  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (metric?.type !== "histogram") return;
    const key = labelKey(labels);
    let entry = metric.entries.get(key);
    if (!entry) {
      entry = {
        buckets: new Array<number>(HISTOGRAM_BUCKETS_MS.length).fill(0),
        sum: 0,
        count: 0,
        labels,
      };
      metric.entries.set(key, entry);
    }
    entry.sum += value;
    entry.count++;
    for (let i = 0; i < HISTOGRAM_BUCKETS_MS.length; i++) {
      if (value <= HISTOGRAM_BUCKETS_MS[i]!) {
        entry.buckets[i]!++;
      }
    }
  }

  exportPrometheus(): string {
    const lines: string[] = [];
    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      if (metric.type === "histogram") {
        for (const entry of metric.entries.values()) {
          for (let i = 0; i < HISTOGRAM_BUCKETS_MS.length; i++) {
            lines.push(
              `${metric.name}_bucket${formatLabels(entry.labels, { le: String(HISTOGRAM_BUCKETS_MS[i]) })} ${entry.buckets[i]}`,
            );
          }
          lines.push(
            `${metric.name}_bucket${formatLabels(entry.labels, { le: "+Inf" })} ${entry.count}`,
          );
          lines.push(`${metric.name}_sum${formatLabels(entry.labels)} ${entry.sum}`);
          lines.push(`${metric.name}_count${formatLabels(entry.labels)} ${entry.count}`);
        }
      } else {
        for (const entry of metric.entries.values()) {
          lines.push(`${metric.name}${formatLabels(entry.labels)} ${entry.value}`);
        }
      }
    }
    return lines.join("\n");
  }
}

function registerDefaultMetrics(metrics: MetricsRegistry) {
  metrics.registerCounter("http_requests_total", "Total HTTP requests");
  metrics.registerCounter("http_requests_errors", "Total HTTP errors");
  metrics.registerHistogram(
    "http_request_duration_ms",
    "HTTP request duration in milliseconds",
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

// Helper functions
export function recordRequest(method: string, path: string, status: number, durationMs: number): void {
  const metrics = getMetricsRegistry();
  const normalizedPath = normalizeMetricPath(path);
  metrics.incrementCounter("http_requests_total", {
    method,
    path: normalizedPath,
    status: String(status),
  });

  if (status >= 500) {
    metrics.incrementCounter("http_requests_errors", {
      method,
      path: normalizedPath,
      status: String(status),
    });
  }

  metrics.observeHistogram("http_request_duration_ms", durationMs, {
    method,
    path: normalizedPath,
  });
}

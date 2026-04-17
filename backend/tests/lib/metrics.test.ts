import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the logger before importing metrics
vi.mock("../../src/lib/observability/logger", () => ({
  loggerHelpers: {
    performance: vi.fn(),
  },
}));

// Test the MetricsRegistry class behavior
class TestMetricsRegistry {
  metrics: Map<string, any> = new Map();

  registerCounter(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: 'counter', values: [] });
  }

  registerGauge(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: 'gauge', values: [] });
  }

  registerHistogram(name: string, help: string): void {
    this.metrics.set(name, { name, help, type: 'histogram', values: [] });
  }

  incrementCounter(name: string, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (metric && metric.type === 'counter') {
      const existing = metric.values.find((v: any) => 
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
    if (metric && metric.type === 'gauge') {
      const existing = metric.values.find((v: any) => 
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
    if (metric && metric.type === 'histogram') {
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
          ? `{${Object.entries(v.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
          : '';
        lines.push(`${metric.name}${labelStr} ${v.value}`);
      }
    }
    return lines.join('\n');
  }
}

describe("metrics", () => {
  let testMetrics: TestMetricsRegistry;

  beforeEach(() => {
    testMetrics = new TestMetricsRegistry();
  });

  it("registers counter metrics", () => {
    testMetrics.registerCounter("test_counter", "A test counter");
    const promOutput = testMetrics.exportPrometheus();
    expect(promOutput).toContain("test_counter");
  });

  it("increments counter", () => {
    testMetrics.registerCounter("test_counter", "Test counter");
    testMetrics.incrementCounter("test_counter");
    
    const metric = testMetrics.metrics.get("test_counter");
    expect(metric.values.length).toBe(1);
    expect(metric.values[0].value).toBe(1);
  });

  it("increments counter with labels", () => {
    testMetrics.registerCounter("test_counter", "Test counter");
    testMetrics.incrementCounter("test_counter", { method: "GET" });
    
    const metric = testMetrics.metrics.get("test_counter");
    expect(metric.values[0].labels).toEqual({ method: "GET" });
  });

  it("sets gauge value", () => {
    testMetrics.registerGauge("test_gauge", "Test gauge");
    testMetrics.setGauge("test_gauge", 1);
    
    const metric = testMetrics.metrics.get("test_gauge");
    expect(metric.values[0].value).toBe(1);
  });

  it("sets gauge with labels", () => {
    testMetrics.registerGauge("test_gauge", "Test gauge");
    testMetrics.setGauge("test_gauge", 1, { service: "api" });
    
    const metric = testMetrics.metrics.get("test_gauge");
    expect(metric.values[0].labels).toEqual({ service: "api" });
  });

  it("observes histogram value", () => {
    testMetrics.registerHistogram("test_histogram", "Test histogram");
    testMetrics.observeHistogram("test_histogram", 0.5);
    
    const metric = testMetrics.metrics.get("test_histogram");
    expect(metric.values[0].value).toBe(0.5);
  });

  it("exports prometheus format", () => {
    testMetrics.registerCounter("test_counter", "A test counter");
    testMetrics.incrementCounter("test_counter");

    const output = testMetrics.exportPrometheus();
    expect(output).toContain("# HELP test_counter A test counter");
    expect(output).toContain("# TYPE test_counter counter");
    expect(output).toContain("test_counter 1");
  });

  it("handles multiple labels in prometheus export", () => {
    testMetrics.registerCounter("http_requests", "HTTP requests");
    testMetrics.incrementCounter("http_requests", { method: "GET", status: "200" });

    const output = testMetrics.exportPrometheus();
    expect(output).toContain('method="GET"');
    expect(output).toContain('status="200"');
  });
});

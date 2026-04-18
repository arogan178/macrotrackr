import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the logger
vi.mock("../../src/lib/observability/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("alerting", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates an alert with correct structure", async () => {
    const { triggerAlert, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler = vi.fn();
    registerAlertHandler(handler);
    
    triggerAlert("test_alert", "critical", "Test message", { key: "value" });
    
    expect(handler).toHaveBeenCalledTimes(1);
    const alert = handler.mock.calls[0][0];
    expect(alert.name).toBe("test_alert");
    expect(alert.severity).toBe("critical");
    expect(alert.message).toBe("Test message");
    expect(alert.metadata).toEqual({ key: "value" });
    expect(alert.timestamp).toBeInstanceOf(Date);
  });

  it("triggers alertAvailabilityViolation", async () => {
    const { alertAvailabilityViolation, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler = vi.fn();
    registerAlertHandler(handler);
    
    // Test with availability below 95% - should be critical
    alertAvailabilityViolation(0.90);
    
    expect(handler).toHaveBeenCalledTimes(1);
    const alert = handler.mock.calls[0][0];
    expect(alert.name).toBe("availability_violation");
    expect(alert.severity).toBe("critical");
  });

  it("triggers alertAvailabilityViolation with warning", async () => {
    const { alertAvailabilityViolation, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler = vi.fn();
    registerAlertHandler(handler);
    
    // Test with availability above 95% - should be warning
    alertAvailabilityViolation(0.96);
    
    expect(handler).toHaveBeenCalledTimes(1);
    const alert = handler.mock.calls[0][0];
    expect(alert.severity).toBe("warning");
  });

  it("triggers alertLatencyViolation", async () => {
    const { alertLatencyViolation, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler = vi.fn();
    registerAlertHandler(handler);
    
    // Test with latency above 2000ms - should be critical
    alertLatencyViolation(2500);
    
    expect(handler).toHaveBeenCalledTimes(1);
    const alert = handler.mock.calls[0][0];
    expect(alert.name).toBe("latency_violation");
    expect(alert.severity).toBe("critical");
  });

  it("triggers alertLatencyViolation with warning", async () => {
    const { alertLatencyViolation, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler = vi.fn();
    registerAlertHandler(handler);
    
    // Test with latency below 2000ms - should be warning
    alertLatencyViolation(1500);
    
    expect(handler).toHaveBeenCalledTimes(1);
    const alert = handler.mock.calls[0][0];
    expect(alert.severity).toBe("warning");
  });

  it("triggers alertErrorRateViolation", async () => {
    const { alertErrorRateViolation, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler = vi.fn();
    registerAlertHandler(handler);
    
    // Test with error rate above 2% - should be critical
    alertErrorRateViolation(0.05);
    
    expect(handler).toHaveBeenCalledTimes(1);
    const alert = handler.mock.calls[0][0];
    expect(alert.name).toBe("error_rate_violation");
    expect(alert.severity).toBe("critical");
  });

  it("triggers alertErrorRateViolation with warning", async () => {
    const { alertErrorRateViolation, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler = vi.fn();
    registerAlertHandler(handler);
    
    // Test with error rate below 2% - should be warning
    alertErrorRateViolation(0.01);
    
    expect(handler).toHaveBeenCalledTimes(1);
    const alert = handler.mock.calls[0][0];
    expect(alert.severity).toBe("warning");
  });

  it("handles multiple handlers", async () => {
    const { triggerAlert, registerAlertHandler } = await import("../../src/lib/observability/alerting");
    
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    registerAlertHandler(handler1);
    registerAlertHandler(handler2);
    
    triggerAlert("multi_handler_test", "info", "Testing multiple handlers");
    
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});

/**
 * Alerting utilities for SLO violations
 */

import { config } from "../../config";
import { logger } from "./logger";

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  name: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

type AlertHandler = (alert: Alert) => void;

export class AlertingService {
  private alertHandlers: AlertHandler[] = [];

  registerAlertHandler(handler: AlertHandler): void {
    this.alertHandlers.push(handler);
  }

  triggerAlert(
    name: string,
    severity: AlertSeverity,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const alert: Alert = {
      name,
      severity,
      message,
      timestamp: new Date(),
      metadata,
    };

    logger.error(
      {
        type: "alert",
        name,
        severity,
        metadata,
      },
      `[${severity.toUpperCase()}] ${name}: ${message}`,
    );

    for (const handler of this.alertHandlers) {
      try {
        handler(alert);
      } catch (error) {
        logger.error(
          {
            type: "alert_handler_error",
            error,
            alert,
          },
          "Alert handler failed",
        );
      }
    }
  }
}

function createDefaultAlertingService() {
  const alerting = new AlertingService();

  if (config.NODE_ENV !== "production" && config.NODE_ENV !== "test") {
    alerting.registerAlertHandler((alert) => {
      console.error("ALERT:", alert);
    });
  }

  return alerting;
}

let alertingRef: AlertingService | null = null;
let alertingConfiguredExplicitly = false;

export function configureAlertingService(service: AlertingService): void {
  alertingRef = service;
  alertingConfiguredExplicitly = true;
}

export function getAlertingService(): AlertingService {
  if (!alertingRef) {
    if (!alertingConfiguredExplicitly) {
      logger.warn(
        {
          type: "implicit_service_initialization",
          service: "alerting",
        },
        "Alerting service accessed before explicit runtime configuration; using default instance.",
      );
    }

    alertingRef = createDefaultAlertingService();
  }

  return alertingRef;
}

export function resetAlertingService(): void {
  alertingRef = null;
  alertingConfiguredExplicitly = false;
}

export function createAlertingService(): AlertingService {
  return createDefaultAlertingService();
}

export function registerAlertHandler(handler: AlertHandler): void {
  getAlertingService().registerAlertHandler(handler);
}

export function triggerAlert(
  name: string,
  severity: AlertSeverity,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  getAlertingService().triggerAlert(name, severity, message, metadata);
}

// SLO violation helpers
export function alertAvailabilityViolation(availability: number): void {
  triggerAlert(
    "availability_violation",
    availability < 0.95 ? "critical" : "warning",
    `Availability dropped to ${(availability * 100).toFixed(2)}%`,
    { availability },
  );
}

export function alertLatencyViolation(p95Latency: number): void {
  triggerAlert(
    "latency_violation",
    p95Latency > 2000 ? "critical" : "warning",
    `p95 latency is ${p95Latency}ms`,
    { p95Latency },
  );
}

export function alertErrorRateViolation(errorRate: number): void {
  triggerAlert(
    "error_rate_violation",
    errorRate > 0.02 ? "critical" : "warning",
    `Error rate is ${(errorRate * 100).toFixed(2)}%`,
    { errorRate },
  );
}

export function alertAuthFailureViolation(failureRate: number): void {
  triggerAlert(
    "auth_failure_violation",
    "warning",
    `Auth failure rate is ${(failureRate * 100).toFixed(2)}%`,
    { failureRate },
  );
}

export function alertWebhookFailureViolation(failureRate: number): void {
  triggerAlert(
    "webhook_failure_violation",
    "warning",
    `Webhook failure rate is ${(failureRate * 100).toFixed(2)}%`,
    { failureRate },
  );
}

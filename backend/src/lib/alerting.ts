/**
 * Alerting utilities for SLO violations
 */

import { logger } from './logger';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  name: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

type AlertHandler = (alert: Alert) => void;

const alertHandlers: AlertHandler[] = [];

export function registerAlertHandler(handler: AlertHandler): void {
  alertHandlers.push(handler);
}

export function triggerAlert(
  name: string,
  severity: AlertSeverity,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const alert: Alert = {
    name,
    severity,
    message,
    timestamp: new Date(),
    metadata,
  };

  // Log the alert
  logger.error(
    {
      type: 'alert',
      name,
      severity,
      metadata,
    },
    `[${severity.toUpperCase()}] ${name}: ${message}`
  );

  // Call registered handlers
  for (const handler of alertHandlers) {
    try {
      handler(alert);
    } catch (error) {
      logger.error(
        {
          type: 'alert_handler_error',
          error,
          alert,
        },
        'Alert handler failed'
      );
    }
  }
}

// Default console handler for development
if (process.env.NODE_ENV !== 'production') {
  registerAlertHandler((alert) => {
    console.error('ALERT:', alert);
  });
}

// SLO violation helpers
export function alertAvailabilityViolation(availability: number): void {
  triggerAlert(
    'availability_violation',
    availability < 0.95 ? 'critical' : 'warning',
    `Availability dropped to ${(availability * 100).toFixed(2)}%`,
    { availability }
  );
}

export function alertLatencyViolation(p95Latency: number): void {
  triggerAlert(
    'latency_violation',
    p95Latency > 2000 ? 'critical' : 'warning',
    `p95 latency is ${p95Latency}ms`,
    { p95Latency }
  );
}

export function alertErrorRateViolation(errorRate: number): void {
  triggerAlert(
    'error_rate_violation',
    errorRate > 0.02 ? 'critical' : 'warning',
    `Error rate is ${(errorRate * 100).toFixed(2)}%`,
    { errorRate }
  );
}

export function alertAuthFailureViolation(failureRate: number): void {
  triggerAlert(
    'auth_failure_violation',
    'warning',
    `Auth failure rate is ${(failureRate * 100).toFixed(2)}%`,
    { failureRate }
  );
}

export function alertWebhookFailureViolation(failureRate: number): void {
  triggerAlert(
    'webhook_failure_violation',
    'warning',
    `Webhook failure rate is ${(failureRate * 100).toFixed(2)}%`,
    { failureRate }
  );
}

import type { Database } from "bun:sqlite";
import { type CacheService, createCacheService } from "./cache-service";
import {
  configureMetricsRegistry,
  createMetricsRegistry,
  type MetricsRegistry,
} from "../lib/observability/metrics";
import {
  configureAlertingService,
  createAlertingService,
  type AlertingService,
} from "../lib/observability/alerting";
import { configureSubscriptionService } from "../modules/billing/subscription-service";
import {
  getStripeClient,
} from "../modules/billing/stripe-service";
import {
  configureEmailService,
  createEmailService,
} from "./email-service";

export interface RuntimeServices {
  db: Database;
  cacheService: CacheService;
  metrics: MetricsRegistry;
  alerting: AlertingService;
  stripe: ReturnType<typeof getStripeClient>;
  email: ReturnType<typeof createEmailService>;
}

export function createRuntimeServices(db: Database): RuntimeServices {
  const cacheService = createCacheService();
  const metrics = createMetricsRegistry();
  const alerting = createAlertingService();
  const stripe = getStripeClient();
  const email = createEmailService();

  configureMetricsRegistry(metrics);
  configureAlertingService(alerting);
  configureSubscriptionService({ db, cacheService });
  configureEmailService(email);

  return {
    db,
    cacheService,
    metrics,
    alerting,
    stripe,
    email,
  };
}

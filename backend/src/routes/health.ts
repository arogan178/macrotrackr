// src/routes/health.ts
import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
import { config } from "../config";
import { logger } from "../lib/logger";

interface HealthRouteContext {
  db: Database;
}

/**
 * Health check routes for monitoring and container orchestration.
 * - GET / - Basic API status
 * - GET /health - Detailed health with database check
 * - GET /health/ready - Readiness probe for Kubernetes
 */
export const healthRoutes = new Elysia({ name: "health-routes" })
  .state("startedAt", new Date().toISOString())
  // Root endpoint
  .get(
    "/",
    ({ store }) => ({
      status: "ok",
      message: "Macro Trackr API is running!",
      timestamp: store.startedAt,
    }),
    {
      detail: { summary: "API Root / Health Check", tags: ["System"] },
    }
  )

  // Health check endpoint for monitoring
  .get(
    "/health",
    (context: HealthRouteContext) => {
      try {
        // Test database connectivity
        const { db } = context;
        const dbCheck = db.prepare("SELECT 1 as health").get() as
          | { health: number }
          | undefined;

        const response = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          environment: config.NODE_ENV,
          database: dbCheck?.health === 1 ? "connected" : "disconnected",
        };

        return response;
      } catch (error) {
        logger.error({ error }, "Health check failed");
        return {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          environment: config.NODE_ENV,
          database: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Health Check Endpoint for Load Balancers",
        tags: ["System"],
      },
    }
  )

  // Readiness probe for Kubernetes
  .get(
    "/health/ready",
    (context: HealthRouteContext) => {
      try {
        // Check if all dependencies are ready
        const { db } = context;
        const dbCheck = db.prepare("SELECT 1 as ready").get() as
          | { ready: number }
          | undefined;

        if (dbCheck?.ready === 1) {
          return { status: "ready", timestamp: new Date().toISOString() };
        } else {
          return { status: "not ready", reason: "database not ready" };
        }
      } catch (error) {
        logger.error({ error }, "Readiness check failed");
        return {
          status: "not ready",
          reason: "database error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Readiness Probe for Container Orchestration",
        tags: ["System"],
      },
    }
  );

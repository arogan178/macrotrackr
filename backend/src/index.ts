import { Elysia } from "elysia";
import { createApp } from "./app";
import { getConfig } from "./config";
import { logger } from "./lib/logger";
import { createDatabase, initializeDatabase } from "./db";
import { createRuntimeServices } from "./services/runtime";

export interface AppBootstrapOptions {
  databasePath?: string;
}

function resolveDatabasePath(): string {
  const runtimeConfig = getConfig();

  return runtimeConfig.NODE_ENV === "test"
    ? ":memory:"
    : runtimeConfig.DATABASE_PATH;
}

export function createServerApp(options: AppBootstrapOptions = {}) {
  const databasePath = options.databasePath ?? resolveDatabasePath();
  const db = initializeDatabase(createDatabase(databasePath), databasePath);

  createRuntimeServices(db);

  return new Elysia().use(createApp(db));
}

let appInstance: Elysia | null = null;

export function getApp(options: AppBootstrapOptions = {}) {
  if (!appInstance) {
    appInstance = createServerApp(options);
  }

  return appInstance;
}

export function startServer() {
  const runtimeConfig = getConfig();
  const app = getApp();

  logger.info("Starting Elysia server...");

  app.listen({
    port: runtimeConfig.PORT,
    hostname: runtimeConfig.HOST,
  });

  logger.info(
    {
      type: "server_started",
      host: app.server?.hostname,
      port: app.server?.port,
      corsOrigin: runtimeConfig.CORS_ORIGIN,
      environment: runtimeConfig.NODE_ENV,
    },
    `Server listening on http://${app.server?.hostname}:${app.server?.port}`
  );

  logger.info(`    CORS Origin: ${runtimeConfig.CORS_ORIGIN}`);
  logger.info(
    `    API Docs: http://${app.server?.hostname}:${app.server?.port}/api/docs`
  );
  logger.info(
    `    Clerk Authentication: Enabled`
  );

  return app;
}

if (import.meta.main) {
  startServer();
}

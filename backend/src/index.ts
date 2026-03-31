import { app } from "./app";
import { config } from "./config";
import { logger } from "./lib/logger";

logger.info("Starting Elysia server...");

// Start server
app.listen({
  port: config.PORT,
  hostname: config.HOST,
});

logger.info(
  {
    type: "server_started",
    host: app.server?.hostname,
    port: app.server?.port,
    corsOrigin: config.CORS_ORIGIN,
    environment: config.NODE_ENV,
  },
  `Server listening on http://${app.server?.hostname}:${app.server?.port}`
);

logger.info(`    CORS Origin: ${config.CORS_ORIGIN}`);
logger.info(
  `    API Docs: http://${app.server?.hostname}:${app.server?.port}/api/docs`
);
logger.info(
  `    Clerk Authentication: Enabled`
);

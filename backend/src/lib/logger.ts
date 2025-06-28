// src/lib/logger.ts
import pino from "pino";
import { config } from "../config";

// Data sanitization for security - remove/mask sensitive fields
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== "object") return data;

  // Create a copy to avoid mutating original data
  const sanitized = { ...data };

  // Remove/mask sensitive fields
  const sensitiveFields = [
    "password",
    "token",
    "jwt",
    "secret",
    "key",
    "authorization",
    "email",
    "phone",
    "ssn",
    "credit_card",
    "creditCard",
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      if (field === "email") {
        // Partially mask email for debugging
        const email = sanitized[field];
        if (typeof email === "string" && email.includes("@")) {
          const parts = email.split("@");
          if (parts.length === 2 && parts[0] && parts[1]) {
            const [local, domain] = parts;
            sanitized[field] = `${local.slice(0, 2)}***@${domain}`;
          } else {
            sanitized[field] = "[EMAIL_MASKED]";
          }
        } else {
          sanitized[field] = "[EMAIL_MASKED]";
        }
      } else {
        sanitized[field] = "[REDACTED]";
      }
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
};

// Create logger with environment-specific configuration
const createLogger = () => {
  const isDevelopment = config.NODE_ENV === "development";

  return pino({
    level: isDevelopment ? "debug" : "info",

    // Development: Pretty formatting, Production: JSON
    transport: isDevelopment
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
          },
        }
      : undefined,

    // Production formatting
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({}), // Remove default pid/hostname in production
    },

    // Add timestamp
    timestamp: pino.stdTimeFunctions.isoTime,

    // Custom serializers for error objects
    serializers: {
      error: pino.stdSerializers.err,
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        userAgent: req.headers?.["user-agent"],
        correlationId: req.correlationId,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        duration: res.duration,
      }),
    },
  });
};

export const logger = createLogger();

// Helper functions for common logging patterns
export const loggerHelpers = {
  // API request logging
  apiRequest: (method: string, path: string, userId?: number, data?: any) => {
    logger.info(
      {
        type: "api_request",
        method,
        path,
        userId,
        data: data ? sanitizeData(data) : undefined,
      },
      `${method} ${path}`
    );
  },

  // API response logging
  apiResponse: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: number
  ) => {
    const level = statusCode >= 400 ? "warn" : "info";
    logger[level](
      {
        type: "api_response",
        method,
        path,
        statusCode,
        duration,
        userId,
      },
      `${method} ${path} - ${statusCode} (${duration}ms)`
    );
  },

  // Database operation logging
  dbQuery: (
    operation: string,
    table: string,
    userId?: number,
    rowCount?: number
  ) => {
    logger.debug(
      {
        type: "db_operation",
        operation,
        table,
        userId,
        rowCount,
      },
      `DB ${operation} on ${table}`
    );
  },

  // Authentication logging
  auth: (
    event: string,
    userId?: number,
    email?: string,
    success: boolean = true
  ) => {
    const level = success ? "info" : "warn";
    logger[level](
      {
        type: "auth_event",
        event,
        userId,
        email: email ? sanitizeData({ email }).email : undefined,
        success,
      },
      `Auth: ${event} ${success ? "successful" : "failed"}`
    );
  },

  // Security event logging
  security: (
    event: string,
    details: any,
    severity: "low" | "medium" | "high" = "medium"
  ) => {
    const level =
      severity === "high" ? "error" : severity === "medium" ? "warn" : "info";
    logger[level](
      {
        type: "security_event",
        event,
        severity,
        details: sanitizeData(details),
      },
      `Security: ${event}`
    );
  },

  // Performance logging
  performance: (operation: string, duration: number, details?: any) => {
    const level = duration > 1000 ? "warn" : "debug";
    logger[level](
      {
        type: "performance",
        operation,
        duration,
        details: details ? sanitizeData(details) : undefined,
      },
      `Performance: ${operation} took ${duration}ms`
    );
  },

  // Error logging with context
  error: (error: Error, context?: any, userId?: number) => {
    logger.error(
      {
        type: "error",
        error,
        context: context ? sanitizeData(context) : undefined,
        userId,
      },
      error.message
    );
  },
};

// Export sanitizeData for use in other modules if needed
export { sanitizeData };

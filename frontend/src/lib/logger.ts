const isDevelopment = import.meta.env.DEV;

const SENSITIVE_KEYS = [
  "token", "password", "secret", "authorization", "cookie",
  "session", "credential", "key", "bearer", "jwt",
];

function redactSensitive(obj: unknown): unknown {
  if (typeof obj === "string") {
    return obj;
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactSensitive(value);
      }
    }
    return result;
  }
  return obj;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args.map(redactSensitive));
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args.map(redactSensitive));
    }
  },
  warn: (...args: unknown[]) => {
    console.warn(...args.map(redactSensitive));
  },
  error: (...args: unknown[]) => {
    console.error(...args.map(redactSensitive));
  },
};

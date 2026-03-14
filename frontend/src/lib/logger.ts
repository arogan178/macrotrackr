const isDevelopment = import.meta.env.DEV;

const SENSITIVE_KEYS = [
  "token", "password", "secret", "authorization", "cookie",
  "session", "credential", "key", "bearer", "jwt",
];

function redactSensitive(object: unknown): unknown {
  if (typeof object === "string") {
    return object;
  }
  if (object === null || object === undefined) {
    return object;
  }
  if (Array.isArray(object)) {
    return object.map(redactSensitive);
  }
  if (typeof object === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(object)) {
      result[key] = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k)) ? "[REDACTED]" : redactSensitive(value);
    }
    return result;
  }
  return object;
}

export const logger = {
  debug: (...arguments_: unknown[]) => {
    if (isDevelopment) {
      console.debug(...arguments_.map(redactSensitive));
    }
  },
  info: (...arguments_: unknown[]) => {
    if (isDevelopment) {
      console.info(...arguments_.map(redactSensitive));
    }
  },
  warn: (...arguments_: unknown[]) => {
    console.warn(...arguments_.map(redactSensitive));
  },
  error: (...arguments_: unknown[]) => {
    console.error(...arguments_.map(redactSensitive));
  },
};

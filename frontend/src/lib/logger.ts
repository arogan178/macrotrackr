const isDevelopment = import.meta.env.DEV;

const SENSITIVE_KEYS = [
  "token", "password", "secret", "authorization", "cookie",
  "session", "credential", "key", "bearer", "jwt",
];

function redact(object: unknown): unknown {
  if (typeof object === "string") {
    return object;
  }
  if (object === null || object === undefined) {
    return object;
  }
  if (Array.isArray(object)) {
    return object.map((item) => redact(item));
  }
  if (typeof object === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(object)) {
      result[key] = SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k)) ? "[REDACTED]" : redact(value);
    }

    return result;
  }

  return object;
}

export const logger = {
  debug: (...arguments_: unknown[]) => {
    if (isDevelopment) {
      console.debug(...arguments_.map((a) => redact(a)));
    }
  },
  info: (...arguments_: unknown[]) => {
    if (isDevelopment) {
      console.info(...arguments_.map((a) => redact(a)));
    }
  },
  warn: (...arguments_: unknown[]) => {
    console.warn(...arguments_.map((a) => redact(a)));
  },
  error: (...arguments_: unknown[]) => {
    console.error(...arguments_.map((a) => redact(a)));
  },
};

const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (...logArguments: unknown[]) => {
    if (isDevelopment) {
      console.debug(...logArguments);
    }
  },
  info: (...logArguments: unknown[]) => {
    if (isDevelopment) {
      console.info(...logArguments);
    }
  },
  warn: (...logArguments: unknown[]) => {
    console.warn(...logArguments);
  },
  error: (...logArguments: unknown[]) => {
    console.error(...logArguments);
  },
};

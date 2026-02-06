import frontendConfig from "./frontend/eslint.config.js";

const PREFIX = "frontend/";

const prefixGlob = (pattern) => {
  if (pattern.startsWith("!")) {
    return `!${PREFIX}${pattern.slice(1)}`;
  }

  return `${PREFIX}${pattern}`;
};

export default frontendConfig.map((config) => {
  const nextConfig = { ...config };

  if (config.files) {
    nextConfig.files = config.files.map(prefixGlob);
  }

  if (config.ignores) {
    nextConfig.ignores = config.ignores.map(prefixGlob);
  }

  return nextConfig;
});

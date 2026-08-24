// The support address is the only way a user can reach us from the privacy
// policy, the terms and the site footer, and it fails silently: a build with
// VITE_SUPPORT_EMAIL unset bakes in the `support@local.invalid` placeholder,
// the pages render a well-formed mailto, and nothing reports that the address
// cannot receive mail. `.invalid` is reserved by RFC 2606 precisely so it can
// never resolve, so anything sent there is gone.
//
// Only the managed build is checked. A self-hosted deployment has no
// macrotrackr.com support desk and is right to keep the placeholder, so the
// gate keys on VITE_AUTH_MODE=clerk, which is what makes a build ours.
import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = new URL("../.env.production", import.meta.url);

/**
 * Vite reads .env.production itself and injects the result, so a local
 * `bun run build` never puts these in process.env. The container build sets
 * them as real env vars instead. Both paths ship, so both are read, with the
 * real environment winning.
 */
function readEnvFile() {
  if (!existsSync(ENV_FILE)) return {};

  const entries = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    entries[trimmed.slice(0, separator).trim()] = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }

  return entries;
}

const fileEnv = readEnvFile();
const read = (key) => process.env[key] ?? fileEnv[key] ?? "";

if (read("VITE_AUTH_MODE") !== "clerk") {
  process.exit(0);
}

const email = read("VITE_SUPPORT_EMAIL");

if (!email) {
  console.error(
    "VITE_SUPPORT_EMAIL is not set, so this build would ship a placeholder\n" +
      "support address on the privacy policy, the terms and the footer.",
  );
  process.exit(1);
}

if (email.toLowerCase().endsWith(".invalid")) {
  console.error(
    `VITE_SUPPORT_EMAIL is ${email}, which is an RFC 2606 reserved domain and\n` +
      "can never receive mail. Set the real support address for a managed build.",
  );
  process.exit(1);
}

// Digital Asset Links verification fails silently: Android just stops opening
// the deep link, and nothing in the app reports why. This checks the file we
// actually deploy, so a placeholder or a malformed fingerprint is caught here
// rather than on a device.
import { readFile } from "node:fs/promises";

const FILE = new URL("../public/.well-known/assetlinks.json", import.meta.url);
const SHA256 = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/;
const EXPECTED_PACKAGE = "com.macrotrackr.app";

const problems = [];
let statements;

try {
  statements = JSON.parse(await readFile(FILE, "utf8"));
} catch (error) {
  console.error(
    `assetlinks.json is missing or not valid JSON: ${error.message}`,
  );
  process.exit(1);
}

if (!Array.isArray(statements) || statements.length === 0) {
  problems.push("expected a non-empty array of statements");
}

for (const [index, statement] of (statements ?? []).entries()) {
  const at = `statement[${index}]`;
  const target = statement?.target ?? {};

  if (
    !statement?.relation?.includes("delegate_permission/common.handle_all_urls")
  ) {
    problems.push(`${at}: missing the handle_all_urls relation`);
  }
  if (target.namespace !== "android_app") {
    problems.push(`${at}: namespace must be "android_app"`);
  }
  if (target.package_name !== EXPECTED_PACKAGE) {
    problems.push(`${at}: package_name must be "${EXPECTED_PACKAGE}"`);
  }

  const fingerprints = target.sha256_cert_fingerprints ?? [];
  if (fingerprints.length === 0) {
    problems.push(`${at}: no sha256_cert_fingerprints`);
  }
  for (const fingerprint of fingerprints) {
    if (!SHA256.test(fingerprint)) {
      problems.push(
        `${at}: "${fingerprint}" is not an uppercase colon-separated SHA-256 fingerprint. ` +
          "Copy it from Play Console → Setup → App signing.",
      );
    }
  }
}

if (problems.length > 0) {
  console.error("assetlinks.json is not ready to deploy:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log("assetlinks.json ok");

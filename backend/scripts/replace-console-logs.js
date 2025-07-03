#!/usr/bin/env node
/**
 * Script to help identify and replace console.log statements with structured logging
 * Run with: node scripts/replace-console-logs.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process
const filesToProcess = [
  "src/modules/user/routes.ts",
  "src/modules/macros/routes.ts",
  "src/modules/goals/routes.ts",
  "src/lib/password.ts",
];

// Replacement patterns
const replacements = {
  // Debug/info logging
  "console.log": "loggerHelpers.apiRequest",
  "console.info": "loggerHelpers.apiRequest",

  // Error logging
  "console.error": "loggerHelpers.error",
  "console.warn": "loggerHelpers.security",
};

function analyzeFile(filePath) {
  const fullPath = path.join(__dirname, "..", filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");

  let consoleStatements = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.includes("console.")) {
      const match = trimmed.match(/(console\.(log|error|warn|info))/);
      if (match) {
        consoleStatements.push({
          line: index + 1,
          content: trimmed,
          type: match[1],
        });
      }
    }
  });

  if (consoleStatements.length > 0) {
    console.log(`\n📄 ${filePath}:`);
    consoleStatements.forEach((stmt) => {
      console.log(
        `   Line ${stmt.line}: ${stmt.type} - ${stmt.content.substring(
          0,
          80
        )}...`
      );
    });
    console.log(`   📊 Total console statements: ${consoleStatements.length}`);
  } else {
    console.log(`✅ ${filePath}: Clean - no console statements found`);
  }

  return consoleStatements.length;
}

function main() {
  console.log("🔍 Analyzing remaining console statements...\n");

  let totalStatements = 0;

  filesToProcess.forEach((file) => {
    totalStatements += analyzeFile(file) || 0;
  });

  console.log(`\n📈 Summary:`);
  console.log(`   Total console statements remaining: ${totalStatements}`);

  if (totalStatements > 0) {
    console.log(`\n💡 Recommended actions:`);
    console.log(
      `   1. Add 'import { loggerHelpers } from "../../lib/logger";' to each file`
    );
    console.log(
      `   2. Replace console.log with loggerHelpers.apiRequest for API operations`
    );
    console.log(
      `   3. Replace console.error with loggerHelpers.error for error scenarios`
    );
    console.log(
      `   4. Consider removing debug console.log statements entirely`
    );
  } else {
    console.log(`   🎉 All console statements have been replaced!`);
  }
}

main();

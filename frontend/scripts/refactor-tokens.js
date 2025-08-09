// scripts/refactor-tokens.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, "../src");
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

// Corrected Regex rules
const rules = [
  // Color classes (using simplified names like 'background', 'foreground', 'muted')
  [/bg-slate-([0-9]+)(\/[0-9]+)?/g, "bg-background$2"],
  [/bg-gray-([89][0-9][0-9])(\/[0-9]+)?/g, "bg-background$2"],
  [/bg-zinc-([89][0-9][0-9])(\/[0-9]+)?/g, "bg-background$2"],
  [/bg-slate-([1-7][0-9][0-9])(\/[0-9]+)?/g, "bg-surface$2"],
  [/bg-gray-([1-7][0-9][0-9])(\/[0-9]+)?/g, "bg-surface$2"],
  [/bg-white(\/[0-9]+)?/g, "bg-surface$1"],
  [/bg-blue-([0-9]+)(\/[0-9]+)?/g, "bg-primary$2"],
  [/bg-indigo-([0-9]+)(\/[0-9]+)?/g, "bg-primary$2"],
  [/text-blue-([0-9]+)(\/[0-9]+)?/g, "text-primary$2"],
  [/text-indigo-([0-9]+)(\/[0-9]+)?/g, "text-primary$2"],
  [/border-blue-([0-9]+)(\/[0-9]+)?/g, "border-primary$2"],
  [/border-indigo-([0-9]+)(\/[0-9]+)?/g, "border-primary$2"],
  [/bg-orange-([0-9]+)(\/[0-9]+)?/g, "bg-vibrant-accent$2"],
  [/bg-red-([45][0-9][0-9])(\/[0-9]+)?/g, "bg-vibrant-accent$2"],
  [/text-orange-([0-9]+)(\/[0-9]+)?/g, "text-vibrant-accent$2"],
  [/text-red-([45][0-9][0-9])(\/[0-9]+)?/g, "text-vibrant-accent$2"],
  [/text-slate-([89][0-9][0-9])(\/[0-9]+)?/g, "text-foreground$2"],
  [/text-gray-([89][0-9][0-9])(\/[0-9]+)?/g, "text-foreground$2"],
  [/text-slate-([1-6][0-9][0-9])(\/[0-9]+)?/g, "text-muted$2"],
  [/text-gray-([1-6][0-9][0-9])(\/[0-9]+)?/g, "text-muted$2"],
  [/text-white(\/[0-9]+)?/g, "text-foreground$1"],
  [/border-slate-([0-9]+)(\/[0-9]+)?/g, "border-border$2"],
  [/border-gray-([0-9]+)(\/[0-9]+)?/g, "border-border$2"],
  [/from-blue-([0-9]+)(\/[0-9]+)?/g, "from-primary$2"],
  [/to-blue-([0-9]+)(\/[0-9]+)?/g, "to-primary$2"],
  [/from-indigo-([0-9]+)(\/[0-9]+)?/g, "from-primary$2"],
  [/to-indigo-([0-9]+)(\/[0-9]+)?/g, "to-primary$2"],
  [/from-slate-([0-9]+)(\/[0-9]+)?/g, "from-surface$2"],
  [/to-slate-([0-9]+)(\/[0-9]+)?/g, "to-surface$2"],
  [/focus:ring-blue-([0-9]+)(\/[0-9]+)?/g, "focus:ring-primary$2"],
  [/focus:ring-indigo-([0-9]+)(\/[0-9]+)?/g, "focus:ring-primary$2"],
  [/focus:border-blue-([0-9]+)(\/[0-9]+)?/g, "focus:border-primary$2"],
  [/focus:border-indigo-([0-9]+)(\/[0-9]+)?/g, "focus:border-primary$2"],
  [/bg-green-([0-9]+)(\/[0-9]+)?/g, "bg-success$2"],
  [/text-green-([0-9]+)(\/[0-9]+)?/g, "text-success$2"],
  [/bg-red-([0-9]+)(\/[0-9]+)?/g, "bg-error$2"],
  [/text-red-([0-9]+)(\/[0-9]+)?/g, "text-error$2"],
  [/bg-yellow-([0-9]+)(\/[0-9]+)?/g, "bg-warning$2"],
  [/text-yellow-([0-9]+)(\/[0-9]+)?/g, "text-warning$2"],
  // Shadow classes
  [/shadow-blue-([0-9]+)(\/[0-9]+)?/g, "shadow-primary$2"],
  [/shadow-indigo-([0-9]+)(\/[0-9]+)?/g, "shadow-primary$2"],
  [/shadow-slate-([0-9]+)(\/[0-9]+)?/g, "shadow-border$2"],
  [/shadow-lg/g, "shadow-primary"],
  [/shadow-xl/g, "shadow-modal"],
  [/shadow-2xl/g, "shadow-modal"],
  [/shadow-md|shadow-sm|shadow-xs|shadow-2xs/g, "shadow-surface"],
  [/shadow-warning|shadow-[^\s"]*warning[^\s"]*/g, "shadow-warning"],
  [/shadow-error|shadow-[^\s"]*error[^\s"]*/g, "shadow-error"],
  [/shadow-success|shadow-[^\s"]*success[^\s"]*/g, "shadow-success"],
  [/shadow-accent|shadow-[^\s"]*accent[^\s"]*/g, "shadow-accent"],
  [/shadow-glow|shadow-[^\s"]*glow[^\s"]*/g, "shadow-glow"],
  // Custom shadow values (manual review recommended)
  [/shadow-\[.*?\]/g, "shadow-glow"], // fallback to glow, review manually for best fit
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let original = content;
  rules.forEach(([search, replace]) => {
    content = content.replace(search, replace);
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (EXTENSIONS.includes(path.extname(fullPath))) {
      processFile(fullPath);
    }
  });
}

console.log("Refactoring Tailwind color and shadow tokens...");
walk(SRC_DIR);
console.log("Done. Review changes and run tests!");

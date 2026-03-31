import fs from "fs";

let content = fs.readFileSync("frontend/src/hooks/queries/useMacroQueries.ts", "utf8");

// Re-write it to use helpers... Wait, it's easier to write a fully refactored file and replace it.

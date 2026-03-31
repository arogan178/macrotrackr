import fs from "fs";

const file = "backend/src/middleware/clerk-auth.ts";
let content = fs.readFileSync(file, "utf8");

// Revert the resolveAuth change
content = content.replace(
  /let authResult;\s*try \{\s*authResult = await resolveAuth\(\);\s*\} catch \(error\) \{\s*logger\.warn\(\s*\{ path, requestPath, error: String\(error\) \},\s*"Clerk auth resolver threw an error \(likely invalid credentials\)"\s*\);\s*authResult = null;\s*\}/,
  \`let authResult = await resolveAuth();\`
);

// Better fallback catch
content = content.replace(
  /logger\.warn\(\s*\{ path, requestPath, error: String\(error\) \},\s*"Bearer token verification fallback failed \(invalid or expired token\)"\s*\);\s*return \{\s*auth: null as \{ userId: string; sessionId: string \| null \} \| null,\s*integrationError: null as Error \| null,\s*\};/,
  \`const errorMessage = String(error).toLowerCase();
          const isTokenError = errorMessage.includes("jwt") || errorMessage.includes("token") || errorMessage.includes("signature") || errorMessage.includes("expired");
          
          if (isTokenError) {
            // Token verification failures (expired, invalid signature) should result in 401, not 500.
            logger.warn(
              { path, requestPath, error: String(error) },
              "Bearer token verification fallback failed (invalid or expired token)"
            );
            return {
              auth: null as { userId: string; sessionId: string | null } | null,
              integrationError: null as Error | null,
            };
          }

          // Unexpected integration failures (e.g. network issues fetching JWKS)
          logger.error(
            { path, requestPath, error },
            "Bearer token verification fallback encountered unexpected error"
          );
          return {
            auth: null as { userId: string; sessionId: string | null } | null,
            integrationError: error instanceof Error ? error : new Error(String(error)),
          };\`/
);

fs.writeFileSync(file, content);

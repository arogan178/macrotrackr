import { app } from "../src/app";
import { db } from "../src/db";

// Force mock verifyToken in Elysia Clerk directly using a monkeypatch for tests
const originalElysia = Object.getPrototypeOf(app).constructor;

export async function setupTestUser() {
  const stmt = db.prepare("SELECT id FROM users WHERE clerk_id = ?");
  const user = stmt.get("test_clerk_user_id") as { id: number } | undefined;

  if (!user) {
    db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, clerk_id)
      VALUES (?, ?, ?, ?, ?)
    `).run("Test", "User", "test@example.com", "fake_hash", "test_clerk_user_id");
  }
}

// A helper for issuing authenticated requests to the app
export const makeAuthenticatedRequest = (appInstance: any, path: string, method = "GET", body?: any) => {
  // We're going to create a custom wrapper around app.handle
  // Elysia lets us push a context manually if we use an internal method,
  // but simpler to use mock token and let clerk fallback mechanism pass it
  
  const headers = new Headers();
  headers.set("Authorization", "Bearer TEST_TOKEN_THAT_BYPASSES_CLERK_VERIFY");
  if (body) headers.set("Content-Type", "application/json");
  
  const init: RequestInit = { method, headers };
  if (body) init.body = JSON.stringify(body);
  
  return appInstance.handle(new Request(`http://localhost${path}`, init));
};

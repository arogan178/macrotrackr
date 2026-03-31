// src/lib/route-adapter.ts
import type { ClerkAuthContext } from "../middleware/clerk-auth";
import { AuthenticationError } from "./errors";

export function resolveClerkIdentity(
  context: ClerkAuthContext,
): { clerkUserId: string; email?: string; firstName?: string; lastName?: string } {
  const { user } = context;

  if (!user?.clerkUserId) {
    throw new AuthenticationError("Authentication required. Please sign in.");
  }

  return {
    clerkUserId: user.clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

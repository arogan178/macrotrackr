import { AuthenticationError } from "../http/errors";

interface ClerkIdentityContext {
  user?: {
    authProvider?: "clerk" | "local";
    providerUserId?: string;
    clerkUserId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  authenticatedUser?: {
    authProvider?: "clerk" | "local";
    providerUserId?: string;
    clerkUserId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export function resolveClerkIdentity(
  context: ClerkIdentityContext,
): { clerkUserId: string; email?: string; firstName?: string; lastName?: string } {
  const user = context.authenticatedUser ?? context.user;

  if (!user) {
    throw new AuthenticationError("Authentication required. Please sign in.");
  }

  if (user.authProvider && user.authProvider !== "clerk") {
    throw new AuthenticationError("Authentication required. Please sign in.");
  }

  const clerkUserId = user.providerUserId ?? user.clerkUserId;

  if (!clerkUserId) {
    throw new AuthenticationError("Authentication required. Please sign in.");
  }

  return {
    clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Holds the Clerk hook implementations without importing @clerk/react.
 *
 * Importing them directly put the 78KB vendor-clerk chunk in the entry graph,
 * so every public page downloaded it and spent 425ms evaluating a module it
 * never used. The implementations are registered from a dynamic import instead,
 * which keeps the chunk off the critical path.
 *
 * `typeof import(...)` is erased at build time, so the types stay exact.
 */
type ClerkAuthState = typeof import("./useAuthState.clerk");
type ClerkAuthQueries = typeof import("./useAuthQueries.clerk");

let registered: {
  state: ClerkAuthState;
  queries: ClerkAuthQueries;
} | null = null;

export function registerClerkAuthHooks(hooks: {
  state: ClerkAuthState;
  queries: ClerkAuthQueries;
}): void {
  registered = hooks;
}

function requireRegistered() {
  if (!registered) {
    throw new Error(
      "Clerk auth hooks were used before registerClerkAuthHooks ran. main.tsx awaits the registration whenever shouldMountClerk is true.",
    );
  }

  return registered;
}

export function useClerkAppAuthState() {
  return requireRegistered().state.useAppAuthState();
}

export function useClerkUser(options?: { enabled?: boolean }) {
  return requireRegistered().queries.useUser(options);
}

export function useClerkLogout() {
  return requireRegistered().queries.useLogout();
}

export function useClerkResetPassword() {
  return requireRegistered().queries.useResetPassword();
}

export function useClerkChangePassword() {
  return requireRegistered().queries.useChangePassword();
}

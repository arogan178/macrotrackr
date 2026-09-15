import { isClerkAuthMode } from "./runtime";

/**
 * Routes that drive Clerk directly: the auth screens, and the signed-in app
 * whose guards redirect through them.
 */
const CLERK_ROUTES = [
  "/login",
  "/register",
  "/reset-password",
  "/sso-callback",
  "/profile-setup",
  "/auth-ready",
  "/home",
  "/goals",
  "/reporting",
  "/settings",
];

export function pathNeedsClerk(pathname: string): boolean {
  return CLERK_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Clerk publishes the session state on the app domain before clerk-js loads.
 * Absent or "0" means there is no session to restore.
 */
export function hasClerkSessionCookie(cookie: string): boolean {
  return cookie.split(";").some((entry) => {
    const [name, ...rest] = entry.trim().split("=");
    const value = rest.join("=");

    return name.startsWith("__client_uat") && value !== "" && value !== "0";
  });
}

/**
 * Mounting ClerkProvider pulls 1.5MB across clerk-js and @clerk/ui, and a
 * visitor reading a calculator never needs any of it. Decided once per document
 * load, so the hook implementations stay stable for the lifetime of the page.
 */
export const shouldMountClerk =
  isClerkAuthMode &&
  (typeof window === "undefined" ||
    hasClerkSessionCookie(document.cookie) ||
    pathNeedsClerk(window.location.pathname));

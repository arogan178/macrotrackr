import { router } from "@/AppRouter";

/**
 * Bridges Clerk's navigation to TanStack Router.
 *
 * Without a router bridge Clerk navigates by assigning to window.location,
 * which tears down and reboots the SPA mid-sign-in. That showed up as
 * /sso-callback fetching itself, two loading spinners in a row, and the
 * auth-ready route mounting twice (which in turn synced the account twice).
 *
 * Clerk also hands us absolute URLs for destinations it owns, such as the
 * Account Portal on a custom domain. Those are not our routes, so anything
 * cross-origin must fall through to a real browser navigation.
 */
export function toInternalPath(to: string): string | null {
  try {
    const url = new URL(to, globalThis.location.origin);
    if (url.origin !== globalThis.location.origin) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    // Not a resolvable URL: let the browser deal with it.
    return null;
  }
}

export function navigateWithRouter(
  to: string,
  replace: boolean,
): Promise<unknown> {
  const internalPath = toInternalPath(to);

  if (internalPath === null) {
    globalThis.location.assign(to);

    return Promise.resolve();
  }

  return router.navigate({ to: internalPath, replace });
}

import type { ReactNode } from "react";
import { Browser } from "@capacitor/browser";

import { isNativePlatform } from "@/services/native/platform";

// The native build serves from a capacitor:// origin, so a relative link has
// no public address to open. Matches the fallback in buildSocialAuthRedirectUrls.
const PUBLIC_SITE_ORIGIN = "https://macrotrackr.com";

const LINK_CLASS =
  "text-primary underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";

interface LegalLinkProps {
  to: "/terms" | "/privacy";
  children: ReactNode;
}

/**
 * Opens a policy document without unmounting the auth form behind it. A new tab
 * on the web, the in-app browser on native: `target="_blank"` there resolves
 * against the capacitor:// scheme and silently opens nothing.
 */
export function LegalLink({ to, children }: LegalLinkProps) {
  return (
    <a
      href={to}
      target="_blank"
      rel="noreferrer"
      className={LINK_CLASS}
      onClick={(event) => {
        if (!isNativePlatform()) {
          return;
        }

        event.preventDefault();
        void Browser.open({ url: `${PUBLIC_SITE_ORIGIN}${to}` });
      }}
    >
      {children}
    </a>
  );
}

import { Link, useLocation,useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import React from "react";

import LogoButton from "@/components/layout/LogoButton";
import { Button } from "@/components/ui";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const posthog = usePostHog();

  const handlePricingClick = () => {
    // If we're already on the landing page, smooth-scroll to the pricing
    // section. Otherwise navigate to the landing page with hash so the
    // browser will scroll after navigation.
    try {
      if (location.pathname === "/") {
        const element = document.querySelector("#pricing");
        if (element instanceof HTMLElement) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          posthog?.capture?.("clicked_pricing_nav", {
            location: "header",
            source: "landing_header",
          });
          return;
        }
      }
      // Navigate to the dedicated pricing route; include a hash manually so
      // the browser can land on the section server-side (or we can scroll on
      // mount of the landing page component). We use '/pricing' because the
      // router type system expects that route path.
      navigate({ to: "/pricing" });
      // Also set the hash so a subsequent navigation to landing can pick it up
      // or the browser can use it when appropriate.
      posthog?.capture?.("clicked_pricing_nav", {
        location: "header",
        source: "pricing_route",
      });
      globalThis.location.hash = "#pricing";
    } catch {
      // Fallback to full navigation
      globalThis.location.href = "/#pricing";
    }
  };

  return (
    <header className="relative z-10 border-b border-border/50 bg-surface backdrop-blur-xl supports-[backdrop-filter]:bg-surface">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <LogoButton className="h-0" />
            <Button
              onClick={handlePricingClick}
              text="Pricing"
              variant="primary"
              buttonSize="md"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="inline-block">
              <Button text="Log In" variant="primary" buttonSize="md" />
            </Link>
            <Link to="/register" className="inline-block">
              <Button text="Sign Up" variant="primary" buttonSize="md" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

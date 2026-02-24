import { Link } from "@tanstack/react-router";
import React, { useCallback, useEffect, useRef, useState } from "react";

import CardContainer from "@/components/form/CardContainer";
import LogoButton from "@/components/layout/LogoButton";
import PageBackground from "@/components/layout/PageBackground";
// UI imports are used via subcomponents; no direct Button usage here
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import ButtonModeToggle from "@/features/auth/components/ButtonModeToggle";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";

// --- Animation Constants (keep in local scope, not shared: only used here) ---
const ANIMATION_HEIGHT_DURATION = 500; // ms
const ANIMATION_FADE_DURATION = 300; // ms
const ANIMATION_MIN_HEIGHT = 200; // px
const ANIMATION_CUBIC_BEZIER = "cubic-bezier(0.4, 0, 0.2, 1)";

/**
 * Inline animation style objects for form transitions.
 * Not shared: only used in AuthPage, not reused elsewhere.
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    transition: `height ${ANIMATION_HEIGHT_DURATION}ms ${ANIMATION_CUBIC_BEZIER}`,
    willChange: "height",
    overflow: "hidden",
  },
  content: {
    transition: `all ${ANIMATION_FADE_DURATION}ms ${ANIMATION_CUBIC_BEZIER}`,
    transform: "translateY(0)",
    opacity: 1,
    willChange: "transform, opacity",
  },
  fadeOut: {
    opacity: 0,
    transform: "translateY(1rem)",
  },
  animating: {
    overflow: "hidden",
    minHeight: `${ANIMATION_MIN_HEIGHT}px`, // Ensure enough space during transitions
  },
  autoHeight: {
    height: "auto !important",
    overflow: "visible",
  },
};

/**
 * AuthPage – Handles login/register form transitions and error display.
 * - Animates between login/register forms with height and fade transitions.
 * - Shows floating error notification if auth.error is present.
 * - Accessible, keyboard-friendly, and follows project conventions.
 */
export default function AuthPage() {
  // Default the visible mode from the current route so '/register' opens the
  // registration form by default and '/login' opens the login form.
  const initialMode = ((): "login" | "register" | "forgotPassword" => {
    try {
      const pathname = globalThis.location?.pathname || "";
      if (pathname === "/register") return "register";
      if (pathname === "/reset-password") return "forgotPassword";
    } catch {
      /* ignore */
    }
    return "login";
  })();

  const [mode, setMode] = useState<"login" | "register" | "forgotPassword">(
    initialMode,
  );
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [visibleMode, setVisibleMode] = useState<
    "login" | "register" | "forgotPassword"
  >(initialMode);

  const formContainerReference = useRef<HTMLDivElement>(null);
  const contentReference = useRef<HTMLDivElement>(null);

  /**
   * Handles animated toggle between login and register forms.
   * Prevents toggle if already animating.
   */
  const toggleMode = useCallback(
    (newMode: "login" | "register" | "forgotPassword"): void => {
      if (isTransitioning || mode === newMode) return;
      setIsTransitioning(true);

      const container = formContainerReference.current;
      const content = contentReference.current;
      if (!container || !content) return;

      // 1. Apply animation styles
      Object.assign(container.style, styles.container, styles.animating);
      // 2. Set initial height
      const currentHeight = container.offsetHeight;
      container.style.height = `${currentHeight}px`;
      // 3. Start fade out
      Object.assign(content.style, { ...styles.content, ...styles.fadeOut });

      // 4. After fade out, switch content
      setTimeout(() => {
        setMode(newMode);
        setVisibleMode(newMode);

        // 5. Animate to new height
        requestAnimationFrame(() => {
          const newHeight = content.scrollHeight;
          container.style.height = `${newHeight}px`;
          // 6. Fade in new content
          Object.assign(content.style, styles.content);
          // 7. Cleanup after animation
          setTimeout(() => {
            Object.assign(container.style, styles.autoHeight);
            setTimeout(() => {
              container.style.height = "";
              container.style.overflow = "";
              container.style.minHeight = "";
              setIsTransitioning(false);
            }, 50);
          }, ANIMATION_HEIGHT_DURATION);
        });
      }, ANIMATION_FADE_DURATION);
    },
    [isTransitioning, mode],
  );

  const renderForm = () => {
    switch (visibleMode) {
      case "login": {
        return (
          <LoginForm onForgotPassword={() => toggleMode("forgotPassword")} />
        );
      }
      case "register": {
        return <RegisterForm />;
      }
      case "forgotPassword": {
        return (
          <ForgotPasswordForm onSwitchToLogin={() => toggleMode("login")} />
        );
      }
      default: {
        return;
      }
    }
  };

  // If the incoming URL doesn't include a `returnTo` param but the user came
  // from a pricing-related flow (referrer or hash), inject a `returnTo`
  // query param via history.replaceState so downstream login/register handlers
  // can read it and redirect the user back to /pricing after auth.
  useEffect(() => {
    try {
      const url = new URL(globalThis.location.href);
      const searchParameters = url.searchParams;
      if (!searchParameters.get("returnTo")) {
        const referrer = document.referrer || "";
        const hash = globalThis.location.hash || "";
        const looksLikePricing =
          referrer.includes("/pricing") || hash.includes("#pricing");
        if (looksLikePricing) {
          searchParameters.set("returnTo", "/pricing");
          const newUrl = `${url.pathname}?${searchParameters.toString()}${url.hash}`;
          globalThis.history.replaceState({}, "", newUrl);
        }
      }
    } catch {
      // don't block rendering on any errors here
    }
  }, []);

  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <div className="relative flex min-h-screen flex-col overflow-hidden text-foreground">
          <PageBackground />
          <header className="z-10 border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-200">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-14 items-center justify-between">
                <Link to="/" className="flex items-center" aria-label="Home">
                  <LogoButton className="!h-auto !p-0" />
                </Link>
              </div>
            </div>
          </header>

          <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <section className="flex w-full flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <CardContainer>
                  {/* Animated form container (login/register) */}
                  <div ref={formContainerReference} style={styles.container}>
                    <div ref={contentReference} style={styles.content}>
                      {renderForm()}
                    </div>
                  </div>
                </CardContainer>
                {/* Toggle login/register button */}
                {mode !== "forgotPassword" && (
                  <div className="mt-8 flex justify-center">
                    <ButtonModeToggle
                      mode={mode}
                      onToggle={() =>
                        toggleMode(mode === "login" ? "register" : "login")
                      }
                    />
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

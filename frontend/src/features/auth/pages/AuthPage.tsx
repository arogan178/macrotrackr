import { useCallback, useRef, useState } from "react";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import {
  ButtonModeToggle,
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
} from "@/features/auth/components";

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
  const [mode, setMode] = useState<"login" | "register" | "forgotPassword">(
    "login",
  );
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [visibleMode, setVisibleMode] = useState<
    "login" | "register" | "forgotPassword"
  >("login");

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

  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <div
          className="auth-page min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          aria-label="Authentication page"
        >
          {/* Background decorative elements (non-interactive, aria-hidden) */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -inset-[10px] opacity-50">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl"></div>
              <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-blue-600/20 rounded-full filter blur-3xl"></div>
            </div>
          </div>

          <div className="w-full max-w-md relative z-10 px-4">
            {/* Error notifications are now handled by individual components */}

            {/* Animated form container (login/register) */}
            <div ref={formContainerReference} style={styles.container}>
              <div ref={contentReference} style={styles.content}>
                {renderForm()}
              </div>
            </div>

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
        </div>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

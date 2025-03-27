import { useState, useCallback, useRef } from "react";
import {
  LoginForm,
  ButtonModeToggle,
  RegisterForm,
} from "@/features/auth/components/index";
import FloatingNotification from "@/features/notifications/components/FloatingNotification";
import { useStore } from "@/store/store";

// Animation style objects
const styles = {
  container: {
    transition: "height 500ms cubic-bezier(0.4, 0, 0.2, 1)",
    willChange: "height",
    overflow: "hidden",
  },
  content: {
    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
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
    minHeight: "200px", // Ensure enough space during transitions
  },
  autoHeight: {
    height: "auto !important",
    overflow: "visible",
  },
};

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visibleMode, setVisibleMode] = useState<"login" | "register">("login");
  const {
    authError, // Using authError instead of auth.error
    clearAuthError,
  } = useStore();

  const formContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Improved animation sequence with better timing
  const toggleMode = useCallback(() => {
    if (isTransitioning) return;

    clearAuthError();
    setIsTransitioning(true);

    // Get container and content elements
    const container = formContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // 1. Add animation styles
    Object.assign(container.style, styles.container, styles.animating);

    // 2. Set initial height before animation
    const currentHeight = container.offsetHeight;
    container.style.height = `${currentHeight}px`;

    // 3. Start fade out animation
    Object.assign(content.style, {
      ...styles.content,
      ...styles.fadeOut,
    });

    // 4. After fade out completes, switch content
    setTimeout(() => {
      const newMode = mode === "login" ? "register" : "login";
      setMode(newMode);
      setVisibleMode(newMode);

      // 5. Calculate and set new height after content switch
      requestAnimationFrame(() => {
        // Allow the DOM to update with new content
        const newHeight = content.scrollHeight;
        container.style.height = `${newHeight}px`;

        // 6. Remove fade-out styles to start fade-in
        Object.assign(content.style, styles.content);

        // 7. After height transition completes, clean up
        setTimeout(() => {
          // Important: Remove fixed height after animation to prevent layout issues
          Object.assign(container.style, styles.autoHeight);

          // Reset state after animation completes
          setTimeout(() => {
            // Reset to default styles
            container.style.height = "";
            container.style.overflow = "";
            container.style.minHeight = "";
            setIsTransitioning(false);
          }, 50); // Short delay to prevent jitter
        }, 500); // Match the duration of height transition
      });
    }, 300); // Match the duration of fade-out transition
  }, [clearAuthError, isTransitioning, mode]);

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl"></div>
          <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-blue-600/20 rounded-full filter blur-3xl"></div>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Error notification */}
        {authError && ( // Using authError instead of error
          <FloatingNotification
            message={authError}
            type="error"
            onClose={clearAuthError}
            duration={5000}
          />
        )}

        {/* Animated form container - now using inline styles */}
        <div ref={formContainerRef} style={styles.container}>
          <div ref={contentRef} style={styles.content}>
            {/* Display based on visibleMode instead of mode for animation sequence */}
            {visibleMode === "login" ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>

        {/* Mode toggle button */}
        <div className="mt-8 flex justify-center">
          <ButtonModeToggle mode={mode} onToggle={toggleMode} />
        </div>
      </div>
    </div>
  );
}

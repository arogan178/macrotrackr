import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icons";

interface InstallPromptProps {
  /** The tab bar only renders for signed-in visitors, so only they need clearing. */
  clearsTabBar?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "mt_install_prompt_dismissed";

const isStandalone = (): boolean =>
  globalThis.matchMedia?.("(display-mode: standalone)").matches ||
  // iOS reports standalone on navigator rather than via display-mode.
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios/i.test(navigator.userAgent);

/**
 * With no APK, installing the PWA is the distribution channel — and nothing
 * told anyone it existed. Chrome hands us the event; iOS has no equivalent, so
 * Safari gets the Share-sheet hint instead of nothing.
 */
const InstallPrompt: React.FC<InstallPromptProps> = ({
  clearsTabBar = false,
}) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(
    () => globalThis.localStorage?.getItem(DISMISSED_KEY) === "1",
  );

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    globalThis.addEventListener("beforeinstallprompt", onBeforeInstall);
    if (isIos()) setShowIosHint(true);

    return () =>
      globalThis.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    globalThis.localStorage?.setItem(DISMISSED_KEY, "1");
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;

    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }, [deferred, dismiss]);

  const visible = !dismissed && (deferred !== null || showIosHint);

  // Anything else docked to the bottom of the viewport needs to know this is
  // there. It is fixed, so it does not take part in layout and would otherwise
  // sit straight on top: measured, it covered the calculators' result bar
  // completely.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.removeProperty("--install-prompt-height");

      return;
    }

    const height = bannerRef.current?.offsetHeight ?? 0;
    root.style.setProperty("--install-prompt-height", `${height}px`);

    return () => {
      root.style.removeProperty("--install-prompt-height");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="complementary"
      aria-label="Install MacroTrackr"
      className="fixed inset-x-4 z-80 mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 md:hidden"
      // 5rem clears the mobile tab bar, which only exists when signed in. On a
      // public page the same offset floated this into the middle of the content:
      // measured, it covered a calculator's Activity Level select and swallowed
      // the tap.
      style={{
        bottom: clearsTabBar ? "calc(5rem + var(--sab))" : "var(--sab)",
      }}
    >
      <p className="flex-1 text-sm">
        {deferred
          ? "Install MacroTrackr for one-tap logging."
          : "Add to Home Screen from the Share menu for one-tap logging."}
      </p>
      {deferred ? (
        <Button variant="primary" buttonSize="sm" onClick={install} text="Install" />
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted hover:text-foreground"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default InstallPrompt;

import { useCallback, useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/Icons";

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
const InstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
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

  if (dismissed || (!deferred && !showIosHint)) return null;

  return (
    <div
      role="complementary"
      aria-label="Install MacroTrackr"
      className="fixed inset-x-4 z-80 mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 lg:hidden"
      style={{ bottom: "calc(5rem + var(--sab))" }}
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

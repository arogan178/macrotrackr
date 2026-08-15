import { useEffect, useState } from "react";

/**
 * The Log sheet is opened from three places that do not share a parent: the
 * mobile tab bar, the launcher shortcut (`/home?log=1`) and Home itself. A DOM
 * event keeps that wiring out of the router's typed search params, which the
 * shortcut URL would otherwise have to be threaded through.
 */
const OPEN_LOG_EVENT = "macrotrackr:open-log";

export const openLogSheet = () => {
  globalThis.dispatchEvent(new CustomEvent(OPEN_LOG_EVENT));
};

const shortcutRequestedLog = (): boolean => {
  if (typeof globalThis.location === "undefined") return false;

  return new URLSearchParams(globalThis.location.search).get("log") === "1";
};

export const useLogSheet = (): [boolean, (open: boolean) => void] => {
  const [isOpen, setIsOpen] = useState(shortcutRequestedLog);

  useEffect(() => {
    const open = () => setIsOpen(true);
    globalThis.addEventListener(OPEN_LOG_EVENT, open);

    return () => globalThis.removeEventListener(OPEN_LOG_EVENT, open);
  }, []);

  useEffect(() => {
    // Drop the shortcut's query string once it has been honoured, so a refresh
    // does not reopen the sheet.
    if (!isOpen || !shortcutRequestedLog()) return;

    const url = new URL(globalThis.location.href);
    url.searchParams.delete("log");
    globalThis.history.replaceState(null, "", url.toString());
  }, [isOpen]);

  return [isOpen, setIsOpen];
};

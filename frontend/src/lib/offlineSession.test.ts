import { onlineManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type OfflineSessionModule = typeof import("./offlineSession");

describe("offline session", () => {
  let session: OfflineSessionModule;
  const reload = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    session = await import("./offlineSession");
    vi.stubGlobal("location", { ...globalThis.location, reload });
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    reload.mockClear();
    document.body.innerHTML = "<form><input /></form>";
    session.startOfflineSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    onlineManager.setOnline(true);
  });

  const type = () => document.querySelector("input")!.dispatchEvent(new Event("input", { bubbles: true }));

  it("holds requests back, since this document has no token to send", () => {
    expect(session.isOfflineSession()).toBe(true);
    expect(onlineManager.isOnline()).toBe(false);

    globalThis.dispatchEvent(new Event("online"));

    expect(onlineManager.isOnline()).toBe(false);
  });

  it("reloads as soon as the connection is back when nothing is being typed", () => {
    globalThis.dispatchEvent(new Event("online"));

    expect(reload).toHaveBeenCalled();
  });

  it("waits for the next screen while a form has input", () => {
    type();
    globalThis.dispatchEvent(new Event("online"));
    expect(reload).not.toHaveBeenCalled();

    session.offlineSessionNavigated();

    expect(reload).toHaveBeenCalled();
  });

  it("reloads once the typed form is submitted and the page is hidden", () => {
    type();
    document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true }));
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");

    document.dispatchEvent(new Event("visibilitychange"));

    expect(reload).toHaveBeenCalled();
  });

  it("never reloads under an open dialog or sheet", () => {
    document.body.insertAdjacentHTML("beforeend", '<div role="dialog"></div>');

    globalThis.dispatchEvent(new Event("online"));
    session.offlineSessionNavigated();

    expect(reload).not.toHaveBeenCalled();
  });

  it("does not reload while the device is still offline", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    session.offlineSessionNavigated();

    expect(reload).not.toHaveBeenCalled();
  });
});

import { renderHook } from "@testing-library/react";

import { useBeforeUnload } from "./useBeforeUnload";

describe("useBeforeUnload", () => {
  function createBeforeUnloadEvent() {
    const event = new Event("beforeunload", { cancelable: true });
    Object.defineProperty(event, "returnValue", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    return event as BeforeUnloadEvent;
  }

  it("prevents unload when hasUnsavedChanges is true", () => {
    renderHook(() => useBeforeUnload(true));

    const event = createBeforeUnloadEvent();
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(event.returnValue).toBe("");
  });

  it("does not prevent unload when hasUnsavedChanges is false", () => {
    renderHook(() => useBeforeUnload(false));

    const event = createBeforeUnloadEvent();
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(event.returnValue).toBeUndefined();
  });

  it("stops preventing unload after the flag changes to false", () => {
    const { rerender } = renderHook(
      ({ hasUnsavedChanges }) => useBeforeUnload(hasUnsavedChanges),
      { initialProps: { hasUnsavedChanges: true } },
    );

    const blockedEvent = createBeforeUnloadEvent();
    window.dispatchEvent(blockedEvent);
    expect(blockedEvent.defaultPrevented).toBe(true);

    rerender({ hasUnsavedChanges: false });

    const allowedEvent = createBeforeUnloadEvent();
    window.dispatchEvent(allowedEvent);
    expect(allowedEvent.defaultPrevented).toBe(false);
  });

  it("cleans up listener on unmount", () => {
    const { unmount } = renderHook(() => useBeforeUnload(true));

    unmount();

    const event = createBeforeUnloadEvent();
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});

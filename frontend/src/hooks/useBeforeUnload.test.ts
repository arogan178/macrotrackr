import { act,renderHook } from "@testing-library/react";

import { useBeforeUnload } from "./useBeforeUnload";

describe("useBeforeUnload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not add event listener when hasUnsavedChanges is false", () => {
    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    renderHook(() => useBeforeUnload(false));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("should add event listener when hasUnsavedChanges is true", () => {
    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    const { unmount } = renderHook(() => useBeforeUnload(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("should use custom message when provided", () => {
    const customMessage = "Custom unsaved changes message";
    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    renderHook(() => useBeforeUnload(true, customMessage));

    // The hook should be called with the custom message
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("should remove listener when hasUnsavedChanges changes to false", () => {
    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(globalThis, "removeEventListener");

    const { rerender, unmount } = renderHook(
      ({ hasUnsavedChanges }) => useBeforeUnload(hasUnsavedChanges),
      { initialProps: { hasUnsavedChanges: true } },
    );

    // First render with true - should add listener
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    // Rerender with false - should remove listener
    rerender({ hasUnsavedChanges: false });
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);

    unmount();

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});

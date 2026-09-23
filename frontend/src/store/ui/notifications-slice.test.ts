import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStore } from "@/store/store";

describe("notifications slice", () => {
  beforeEach(() => {
    useStore.setState({ notifications: [] });
  });

  it("keeps the action on the notification", () => {
    const onClick = vi.fn();
    useStore.getState().showNotification("Action kept", "success", {
      action: { label: "Undo", onClick },
    });

    expect(useStore.getState().notifications[0]?.action).toEqual({
      label: "Undo",
      onClick,
    });
  });

  it("does not drop a repeated notification that has an action", () => {
    const { showNotification } = useStore.getState();
    showNotification("Repeated with action", "success", {
      action: { label: "Undo", onClick: vi.fn() },
    });
    showNotification("Repeated with action", "success", {
      action: { label: "Undo", onClick: vi.fn() },
    });

    expect(useStore.getState().notifications).toHaveLength(2);
  });

  it("still drops a repeated plain notification", () => {
    const { showNotification } = useStore.getState();
    showNotification("Repeated plain", "error");
    showNotification("Repeated plain", "error");

    expect(useStore.getState().notifications).toHaveLength(1);
  });
});

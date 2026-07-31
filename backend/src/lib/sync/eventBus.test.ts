import { describe, expect, it, vi } from "vitest";
import { publishUserSyncEvent, subscribeUserSync } from "./eventBus";

describe("eventBus", () => {
  it("delivers published sync events to subscribed listeners for a user", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUserSync(123, listener);

    publishUserSyncEvent(123, "macros", "client-a");

    expect(listener).toHaveBeenCalledWith({
      type: "data_changed",
      topic: "macros",
      timestamp: expect.any(Number),
      clientInstanceId: "client-a",
    });

    unsubscribe();
  });

  it("does not deliver events to unsubscribed listeners or other users", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubA = subscribeUserSync(123, listenerA);
    subscribeUserSync(456, listenerB);

    unsubA();
    publishUserSyncEvent(123, "goals");

    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).not.toHaveBeenCalled();
  });
});

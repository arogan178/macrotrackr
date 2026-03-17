import { describe, expect, it } from "vitest";

import { useStore } from "./store";

describe("store", () => {
  it("exports useStore hook", () => {
    expect(useStore).toBeDefined();
    expect(typeof useStore).toBe("function");
  });

  it("has getState method", () => {
    expect(useStore.getState).toBeDefined();
    expect(typeof useStore.getState).toBe("function");
  });

  it("has setState method", () => {
    expect(useStore.setState).toBeDefined();
    expect(typeof useStore.setState).toBe("function");
  });

  it("has subscribe method", () => {
    expect(useStore.subscribe).toBeDefined();
    expect(typeof useStore.subscribe).toBe("function");
  });
});

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePageMetadata } from "./usePageMetadata";

describe("usePageMetadata", () => {
  it("sets document title", () => {
    const originalTitle = document.title;
    
    renderHook(() => usePageMetadata({ title: "Test Title" }));
    
    expect(document.title).toBe("Test Title");
    document.title = originalTitle;
  });

  it("does not modify title when not provided", () => {
    const originalTitle = document.title;
    
    renderHook(() => usePageMetadata({}));
    
    expect(document.title).toBe(originalTitle);
  });
});

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openLogSheet } from "@/lib/logSheet";

import LogSheet from "./LogSheet";

const { captureMock } = vi.hoisted(() => ({ captureMock: vi.fn() }));

vi.mock("@/lib/productAnalytics", () => ({
  useProductAnalytics: () => ({ capture: captureMock }),
}));
vi.mock("./LogSheetForm", () => ({ default: () => null }));

describe("LogSheet analytics", () => {
  beforeEach(() => {
    captureMock.mockClear();
  });

  afterEach(() => {
    globalThis.history.replaceState(null, "", "/");
  });

  it("records a sheet opened by the shortcut URL", () => {
    globalThis.history.replaceState(null, "", "/home?log=1");

    render(<LogSheet />);

    expect(captureMock).toHaveBeenCalledWith({
      event: "log_sheet_opened",
      properties: { trigger: "shortcut" },
    });
  });

  it("records a sheet opened by a button", () => {
    render(<LogSheet />);
    expect(captureMock).not.toHaveBeenCalled();

    act(() => openLogSheet());

    expect(captureMock).toHaveBeenCalledWith({
      event: "log_sheet_opened",
      properties: { trigger: "button" },
    });
  });
});

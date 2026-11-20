import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Modal from "./Modal";

describe("Modal Escape stack", () => {
  beforeEach(() => {
    if (!document.querySelector("#modal-root")) {
      const root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
  });

  it("keeps the topmost dialog on top even when a lower dialog receives a new onClose reference", () => {
    const firstCloseA = vi.fn();
    const firstCloseB = vi.fn();
    const secondClose = vi.fn();

    const { rerender } = render(
      <>
        <Modal isOpen onClose={firstCloseA} title="Lower">
          Lower
        </Modal>
        <Modal isOpen onClose={secondClose} title="Upper">
          Upper
        </Modal>
      </>,
    );

    // Re-rendering the lower modal with a fresh onClose closure must not
    // push it above the upper modal on the Escape stack.
    rerender(
      <>
        <Modal isOpen onClose={firstCloseB} title="Lower">
          Lower
        </Modal>
        <Modal isOpen onClose={secondClose} title="Upper">
          Upper
        </Modal>
      </>,
    );

    fireEvent.keyDown(globalThis, { key: "Escape" });

    expect(secondClose).toHaveBeenCalledTimes(1);
    expect(firstCloseA).not.toHaveBeenCalled();
    expect(firstCloseB).not.toHaveBeenCalled();
  });
});

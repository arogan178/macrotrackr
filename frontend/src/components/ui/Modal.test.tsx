import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import Modal from "./Modal";

function Harness({ autoFocusInput = false }: { autoFocusInput?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open
      </button>
      <Modal
        variant="form"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit entry"
        onSave={() => setIsOpen(false)}
      >
        {/* eslint-disable-next-line jsx-a11y/no-autofocus -- behaviour under test */}
        <input aria-label="Name" autoFocus={autoFocusInput} />
      </Modal>
    </>
  );
}

describe("Modal focus management", () => {
  beforeEach(() => {
    if (!document.querySelector("#modal-root")) {
      const modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.append(modalRoot);
    }
  });

  it("moves focus into the dialog on open", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("button", { name: "Close modal" })).toHaveFocus();
  });

  it("keeps an autofocused child focused", async () => {
    const user = userEvent.setup();
    render(<Harness autoFocusInput />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  });

  it("wraps Tab and Shift+Tab within the dialog", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    const close = screen.getByRole("button", { name: "Close modal" });
    const save = screen.getByRole("button", { name: "Save" });

    save.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(save).toHaveFocus();
  });

  it("restores focus to the trigger on close", async () => {
    const user = userEvent.setup();
    render(<Harness autoFocusInput />);
    const trigger = screen.getByRole("button", { name: "Open" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("labels the dialog by its rendered title", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(
      screen.getByRole("dialog", { name: "Edit entry" }),
    ).toBeInTheDocument();
  });
});

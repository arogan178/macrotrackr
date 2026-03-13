import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Modal from "./Modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test" variant="form">
        Content
      </Modal>
    );
    expect(container.innerHTML).not.toContain("Content");
  });

  it("renders when open", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" variant="form">
        Modal Content
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeDefined();
  });

  it("renders children when open", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Title" variant="form">
        <p>Child content</p>
      </Modal>
    );
    expect(screen.getByText("Child content")).toBeDefined();
  });
});

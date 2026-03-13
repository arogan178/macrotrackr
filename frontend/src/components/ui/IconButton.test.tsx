import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import IconButton from "./IconButton";

describe("IconButton", () => {
  it("renders button", () => {
    render(<IconButton ariaLabel="Delete" onClick={() => {}} variant="delete" />);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("has aria label", () => {
    render(<IconButton ariaLabel="Delete item" onClick={() => {}} variant="delete" />);
    expect(screen.getByLabelText("Delete item")).toBeDefined();
  });

  it("can be disabled", () => {
    render(<IconButton ariaLabel="Disabled" onClick={() => {}} variant="edit" disabled />);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  });

  it("handles click", () => {
    let clicked = false;
    render(<IconButton ariaLabel="Click me" onClick={() => { clicked = true; }} variant="edit" />);
    screen.getByRole("button").click();
    expect(clicked).toBe(true);
  });

  it("renders edit variant", () => {
    render(<IconButton ariaLabel="Edit" onClick={() => {}} variant="edit" />);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("renders close variant", () => {
    render(<IconButton ariaLabel="Close" onClick={() => {}} variant="close" />);
    expect(screen.getByRole("button")).toBeDefined();
  });
});

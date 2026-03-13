import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Button from "./Button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("renders with text prop", () => {
    render(<Button text="Submit" />);
    expect(screen.getByText("Submit")).toBeDefined();
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  });

  it("renders loading state", () => {
    render(<Button isLoading loadingText="Loading...">Submit</Button>);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("handles click", () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    screen.getByRole("button").click();
    expect(clicked).toBe(true);
  });
});

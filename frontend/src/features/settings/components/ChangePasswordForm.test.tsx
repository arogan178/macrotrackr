import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChangePasswordForm from "./ChangePasswordForm";

describe("ChangePasswordForm", () => {
  it("renders without crashing", () => {
    const { container } = render(<ChangePasswordForm />);
    expect(container).toBeDefined();
  });
});

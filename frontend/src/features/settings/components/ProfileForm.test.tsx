import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProfileForm from "./ProfileForm";

describe("ProfileForm", () => {
  it("renders without crashing", () => {
    const { container } = render(<ProfileForm />);
    expect(container).toBeDefined();
  });
});

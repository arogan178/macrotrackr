import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProfileForm from "./ProfileForm";

describe("ProfileForm", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <ProfileForm
        settings={{
          id: 1,
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          dateOfBirth: "1990-01-01",
          height: 175,
          weight: 70,
          activityLevel: 3,
          gender: "male",
          subscription: { status: "free" },
        }}
        updateSetting={() => {}}
        formErrors={{}}
        onSubmit={async () => {}}
        isSaving={false}
        hasChanges={false}
      />,
    );
    expect(container).toBeDefined();
  });
});

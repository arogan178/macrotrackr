import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SecondFactorChallenge } from "@/features/auth/components/SecondFactorChallenge";
import type { SecondFactorOption } from "@/features/auth/utils/secondFactor";

const emailFactor: SecondFactorOption = {
  strategy: "email_code",
  emailAddressId: "idn_1",
  safeIdentifier: "j****@example.com",
};

const totpFactor: SecondFactorOption = { strategy: "totp" };
const backupFactor: SecondFactorOption = { strategy: "backup_code" };

function renderChallenge(overrides: Partial<Parameters<typeof SecondFactorChallenge>[0]> = {}) {
  const properties = {
    option: emailFactor,
    options: [emailFactor],
    isDeviceTrust: true,
    code: "",
    onCodeChange: vi.fn(),
    onSubmit: vi.fn(),
    onResend: vi.fn(),
    onSelectStrategy: vi.fn(),
    onCancel: vi.fn(),
    isVerifying: false,
    isResending: false,
    ...overrides,
  };

  render(<SecondFactorChallenge {...properties} />);

  return properties;
}

describe("SecondFactorChallenge", () => {
  it("frames the challenge as device verification and names the destination", () => {
    renderChallenge();

    expect(screen.getByText("Verify this device")).toBeInTheDocument();
    expect(screen.getByText(/j\*{4}@example\.com/)).toBeInTheDocument();
  });

  it("submits the entered code", async () => {
    const user = userEvent.setup();
    const properties = renderChallenge({ code: "123456" });

    await user.click(screen.getByRole("button", { name: "Verify" }));

    expect(properties.onSubmit).toHaveBeenCalledOnce();
  });

  it("blocks submission until a code is entered", () => {
    renderChallenge({ code: "   " });

    expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();
  });

  it("offers a resend for delivered codes but not for TOTP", () => {
    const { unmount } = render(
      <SecondFactorChallenge
        option={emailFactor}
        options={[emailFactor]}
        isDeviceTrust
        code=""
        onCodeChange={vi.fn()}
        onSubmit={vi.fn()}
        onResend={vi.fn()}
        onSelectStrategy={vi.fn()}
        onCancel={vi.fn()}
        isVerifying={false}
        isResending={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();
    unmount();

    renderChallenge({ option: totpFactor, options: [totpFactor] });
    expect(screen.queryByRole("button", { name: "Resend code" })).not.toBeInTheDocument();
    expect(screen.getByText("Two-factor authentication")).toBeInTheDocument();
  });

  it("lets the user switch to another available factor", async () => {
    const user = userEvent.setup();
    const properties = renderChallenge({
      option: totpFactor,
      options: [totpFactor, backupFactor],
      isDeviceTrust: false,
    });

    await user.click(screen.getByRole("button", { name: "Use a backup code" }));

    expect(properties.onSelectStrategy).toHaveBeenCalledWith(backupFactor);
  });

  it("does not offer the factor already in use as an alternative", () => {
    renderChallenge({ option: totpFactor, options: [totpFactor] });

    expect(screen.queryByText("Try another way")).not.toBeInTheDocument();
  });

  it("surfaces a verification error to assistive tech", () => {
    renderChallenge({ error: "That code has expired. Request a new one." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That code has expired. Request a new one.",
    );
  });

  it("can be abandoned", async () => {
    const user = userEvent.setup();
    const properties = renderChallenge();

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(properties.onCancel).toHaveBeenCalledOnce();
  });
});

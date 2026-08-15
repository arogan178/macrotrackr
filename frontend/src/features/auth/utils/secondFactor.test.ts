import { describe, expect, it } from "vitest";

import {
  buildPrepareParams as buildPrepareParameters,
  describeSecondFactor,
  isNumericCode,
  parseSecondFactors,
  requiresCodeDelivery,
  selectPreferredSecondFactor,
} from "./secondFactor";

describe("parseSecondFactors", () => {
  it("keeps supported strategies and their identifiers", () => {
    const parsed = parseSecondFactors([
      {
        strategy: "email_code",
        emailAddressId: "idn_123",
        safeIdentifier: "j****@example.com",
      },
      { strategy: "phone_code", phoneNumberId: "idn_456", safeIdentifier: "+1****789" },
    ]);

    expect(parsed).toEqual([
      {
        strategy: "email_code",
        emailAddressId: "idn_123",
        phoneNumberId: undefined,
        safeIdentifier: "j****@example.com",
      },
      {
        strategy: "phone_code",
        emailAddressId: undefined,
        phoneNumberId: "idn_456",
        safeIdentifier: "+1****789",
      },
    ]);
  });

  it("drops unknown strategies rather than offering a dead end", () => {
    const parsed = parseSecondFactors([
      { strategy: "email_code" },
      { strategy: "some_future_strategy" },
      { notAFactor: true },
      null,
      "nonsense",
    ]);

    expect(parsed.map((option) => option.strategy)).toEqual(["email_code"]);
  });

  it("de-duplicates repeated strategies", () => {
    const parsed = parseSecondFactors([
      { strategy: "email_code", emailAddressId: "a" },
      { strategy: "email_code", emailAddressId: "b" },
    ]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.emailAddressId).toBe("a");
  });

  it("handles missing input", () => {
    expect(parseSecondFactors(null)).toEqual([]);
    expect(parseSecondFactors(undefined)).toEqual([]);
    expect(parseSecondFactors([])).toEqual([]);
  });
});

describe("selectPreferredSecondFactor", () => {
  it("prefers TOTP, which needs no delivery round trip", () => {
    const selected = selectPreferredSecondFactor([
      { strategy: "backup_code" },
      { strategy: "email_code" },
      { strategy: "totp" },
    ]);

    expect(selected?.strategy).toBe("totp");
  });

  it("prefers phone over email when both are offered", () => {
    const selected = selectPreferredSecondFactor([
      { strategy: "email_code" },
      { strategy: "phone_code" },
    ]);

    expect(selected?.strategy).toBe("phone_code");
  });

  it("leaves backup codes as the last resort", () => {
    const selected = selectPreferredSecondFactor([{ strategy: "backup_code" }]);

    expect(selected?.strategy).toBe("backup_code");
  });

  it("returns undefined when nothing is available", () => {
    expect(selectPreferredSecondFactor([])).toBeUndefined();
  });
});

describe("requiresCodeDelivery", () => {
  it("is true only for strategies Clerk has to send", () => {
    expect(requiresCodeDelivery("email_code")).toBe(true);
    expect(requiresCodeDelivery("phone_code")).toBe(true);
    expect(requiresCodeDelivery("totp")).toBe(false);
    expect(requiresCodeDelivery("backup_code")).toBe(false);
  });
});

describe("buildPrepareParams", () => {
  it("passes the address id through when Clerk supplied one", () => {
    expect(
      buildPrepareParameters({ strategy: "email_code", emailAddressId: "idn_1" }),
    ).toEqual({ strategy: "email_code", emailAddressId: "idn_1" });

    expect(
      buildPrepareParameters({ strategy: "phone_code", phoneNumberId: "idn_2" }),
    ).toEqual({ strategy: "phone_code", phoneNumberId: "idn_2" });
  });

  it("omits the id when absent so Clerk picks the default destination", () => {
    expect(buildPrepareParameters({ strategy: "email_code" })).toEqual({
      strategy: "email_code",
    });
  });

  it("returns null for strategies that need no preparation", () => {
    expect(buildPrepareParameters({ strategy: "totp" })).toBeNull();
    expect(buildPrepareParameters({ strategy: "backup_code" })).toBeNull();
  });
});

describe("describeSecondFactor", () => {
  it("frames email codes as device verification during Device Trust", () => {
    const copy = describeSecondFactor(
      { strategy: "email_code", safeIdentifier: "j****@example.com" },
      true,
    );

    expect(copy.title).toBe("Verify this device");
    expect(copy.description).toContain("j****@example.com");
    expect(copy.resendLabel).toBe("Resend code");
  });

  it("frames the same factor as a normal check during MFA", () => {
    const copy = describeSecondFactor({ strategy: "email_code" }, false);

    expect(copy.title).toBe("Check your email");
  });

  it("does not offer a resend for factors the user already holds", () => {
    expect(describeSecondFactor({ strategy: "totp" }, false).resendLabel).toBeUndefined();
    expect(
      describeSecondFactor({ strategy: "backup_code" }, false).resendLabel,
    ).toBeUndefined();
  });
});

describe("isNumericCode", () => {
  it("treats backup codes as alphanumeric and the rest as numeric", () => {
    expect(isNumericCode("backup_code")).toBe(false);
    expect(isNumericCode("email_code")).toBe(true);
    expect(isNumericCode("totp")).toBe(true);
  });
});

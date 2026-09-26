import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import QuantityUnitField from "./QuantityUnitField";

describe("QuantityUnitField", () => {
  it("names the quantity input and the unit select for assistive tech", () => {
    render(
      <QuantityUnitField
        label="Oats"
        quantity={40}
        unit="g"
        onQuantityChange={() => {}}
        onUnitChange={() => {}}
      />,
    );

    expect(screen.getByLabelText("Oats")).toHaveValue(40);
    expect(screen.getByLabelText("Oats unit")).toHaveValue("g");
  });
});

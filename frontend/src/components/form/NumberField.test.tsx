import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NumberField from "./NumberField";

describe("NumberField", () => {
  it("keeps each input named by its own label when the same field renders twice", () => {
    // Home mounts the inline form and the Log sheet together; the hidden copy must not steal the label.
    render(
      <>
        <div hidden>
          <NumberField label="Protein" value={undefined} onChange={() => {}} />
        </div>
        <NumberField label="Protein" value={undefined} onChange={() => {}} />
      </>,
    );

    expect(screen.getByRole("spinbutton", { name: "Protein" })).toBeVisible();
  });
});

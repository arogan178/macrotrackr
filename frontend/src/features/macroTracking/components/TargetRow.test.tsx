import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TargetRow from "./TargetRow";

describe("TargetRow", () => {
  it("shows logged grams without 'of 0' or '0 g left' when no target is set", () => {
    render(
      <ul>
        <TargetRow
          name="Protein"
          value={168}
          target={0}
          unit="g"
          colorClass="bg-protein"
        />
      </ul>,
    );

    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("168")).toBeInTheDocument();
    expect(screen.queryByText(/of 0/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/left/i)).not.toBeInTheDocument();
  });

  it("shows target progress and remaining grams when a target is set", () => {
    render(
      <ul>
        <TargetRow
          name="Protein"
          value={120}
          target={160}
          unit="g"
          colorClass="bg-protein"
        />
      </ul>,
    );

    expect(screen.getByText(/of 160/)).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText(/left/)).toBeInTheDocument();
  });
});

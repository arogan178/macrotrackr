import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DataImporter from "./DataImporter";

describe("DataImporter", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  it("renders the import header and supported platform badges", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DataImporter />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Import your history")).toBeDefined();
    expect(screen.getByText("MyFitnessPal")).toBeDefined();
    expect(screen.getByText("Cronometer")).toBeDefined();
    expect(screen.getByText("MacroFactor")).toBeDefined();
    expect(screen.getByText("Lose It!")).toBeDefined();
    expect(screen.getByText("MacroTrackr")).toBeDefined();
    expect(
      screen.getByText("Choose your export file"),
    ).toBeDefined();
  });
});

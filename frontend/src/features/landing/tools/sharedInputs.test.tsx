import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MacroCalculatorPage from "../pages/MacroCalculatorPage";
import TdeeCalculatorPage from "../pages/TdeeCalculatorPage";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/" }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

vi.mock("@posthog/react", () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: () => ({ isLoaded: true, isSignedIn: false }),
}));

vi.mock("@/hooks/usePageMetadata", () => ({
  usePageMetadata: vi.fn(),
}));

const writeText = vi.fn<(text: string) => Promise<void>>();

function openAt(url: string) {
  globalThis.history.replaceState({}, "", url);
}

async function sharedUrl(): Promise<URL> {
  fireEvent.click(screen.getByRole("button", { name: /share these results/i }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());

  return new URL(writeText.mock.calls[0][0]);
}

beforeEach(() => {
  writeText.mockReset().mockResolvedValue();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: undefined,
  });
});

afterEach(() => {
  openAt("/");
});

describe("shareable calculator results", () => {
  it("reopens a shared link with its inputs", async () => {
    openAt(
      "/tools/tdee-calculator?sex=female&age=41&weight=62.5&height=164&activity=high",
    );
    render(<TdeeCalculatorPage />);

    await waitFor(() =>
      expect(screen.getByLabelText(/^age$/i)).toHaveValue(41),
    );
    expect(screen.getByLabelText(/weight/i)).toHaveValue(62.5);
  });

  it("keeps defaults for values outside the form's range", async () => {
    openAt("/tools/tdee-calculator?age=999&weight=abc&activity=couch");
    render(<TdeeCalculatorPage />);

    const url = await sharedUrl();

    expect(url.searchParams.get("age")).toBe("28");
    expect(url.searchParams.get("weight")).toBe("75");
    expect(url.searchParams.get("activity")).toBe("medium");
  });

  it("copies a link to the canonical page carrying the current inputs", async () => {
    openAt("/tools/tdee-calculator");
    render(<TdeeCalculatorPage />);

    fireEvent.change(screen.getByLabelText(/^age$/i), {
      target: { value: "35" },
    });
    const url = await sharedUrl();

    expect(url.pathname).toBe("/tools/tdee-calculator");
    expect(url.searchParams.get("age")).toBe("35");
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument();
  });

  it("only restores a macro split that adds up to 100", async () => {
    openAt("/tools/macro-calculator?protein=40&carbs=40&fats=40");
    const { unmount } = render(<MacroCalculatorPage />);
    expect((await sharedUrl()).searchParams.get("protein")).toBe("30");
    unmount();

    writeText.mockClear();
    openAt("/tools/macro-calculator?protein=40&carbs=35&fats=25");
    render(<MacroCalculatorPage />);
    expect((await sharedUrl()).searchParams.get("protein")).toBe("40");
  });
});

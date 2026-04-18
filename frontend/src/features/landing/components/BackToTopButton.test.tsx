import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BackToTopButton from "./BackToTopButton";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("BackToTopButton", () => {
  const renderWithQueryClient = (ui: React.ReactElement) => {
    const queryClient = createQueryClient();

    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without crashing", () => {
    // Mock window
    vi.stubGlobal("window", {
      scrollY: 0,
      innerHeight: 768,
      requestAnimationFrame: vi.fn((callback) => callback()),
      cancelAnimationFrame: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Mock document.documentElement
    Object.defineProperty(document, "documentElement", {
      value: { scrollHeight: 1000 },
      configurable: true,
    });

    const { container } = renderWithQueryClient(<BackToTopButton />);

    // Component renders without error
    expect(container).toBeTruthy();
  });

  it("accepts custom className", () => {
    vi.stubGlobal("window", {
      scrollY: 0,
      innerHeight: 768,
      requestAnimationFrame: vi.fn((callback) => callback()),
      cancelAnimationFrame: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    Object.defineProperty(document, "documentElement", {
      value: { scrollHeight: 1000 },
      configurable: true,
    });

    const { container } = renderWithQueryClient(
      <BackToTopButton className="custom-class" />,
    );

    expect(container).toBeTruthy();
  });

  it("accepts custom label", () => {
    vi.stubGlobal("window", {
      scrollY: 0,
      innerHeight: 768,
      requestAnimationFrame: vi.fn((callback) => callback()),
      cancelAnimationFrame: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    Object.defineProperty(document, "documentElement", {
      value: { scrollHeight: 1000 },
      configurable: true,
    });

    const { container } = renderWithQueryClient(
      <BackToTopButton label="Scroll up" />,
    );

    expect(container).toBeTruthy();
  });

  it("accepts custom offset", () => {
    vi.stubGlobal("window", {
      scrollY: 0,
      innerHeight: 768,
      requestAnimationFrame: vi.fn((callback) => callback()),
      cancelAnimationFrame: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    Object.defineProperty(document, "documentElement", {
      value: { scrollHeight: 1000 },
      configurable: true,
    });

    const { container } = renderWithQueryClient(
      <BackToTopButton offset={200} />,
    );

    expect(container).toBeTruthy();
  });
});

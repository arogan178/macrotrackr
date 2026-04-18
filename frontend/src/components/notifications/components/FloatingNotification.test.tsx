import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach,beforeEach, describe, expect, it, vi } from "vitest";

import FloatingNotification from "./FloatingNotification";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("FloatingNotification", () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    message: "Test notification",
    type: "info" as const,
    onClose: mockOnClose,
  };

  const renderWithQueryClient = (ui: React.ReactElement) => {
    const queryClient = createQueryClient();

    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnClose.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with message and type", () => {
    renderWithQueryClient(<FloatingNotification {...defaultProps} />);

    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });

  it("has correct role and aria attributes", () => {
    renderWithQueryClient(<FloatingNotification {...defaultProps} />);

    const notification = screen.getByRole("alert");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveAttribute("aria-live", "assertive");
    expect(notification).toHaveAttribute("aria-atomic", "true");
  });

  it("applies custom topOffset when provided", () => {
    renderWithQueryClient(
      <FloatingNotification {...defaultProps} topOffset={20} />,
    );
    const notification = screen.getByRole("alert");
    expect(notification.style.marginTop).toBe("20px");
  });

  it("accepts string topOffset", () => {
    renderWithQueryClient(
      <FloatingNotification {...defaultProps} topOffset="2rem" />,
    );
    const notification = screen.getByRole("alert");
    expect(notification.style.marginTop).toBe("2rem");
  });

  it("uses default duration of 5000ms", () => {
    const { container } = renderWithQueryClient(
      <FloatingNotification {...defaultProps} />,
    );

    // The progress bar should be present when autoClose is enabled
    const progressBar = container.querySelector(".bg-primary");
    expect(progressBar).toBeInTheDocument();
  });

  it("respects custom duration", () => {
    const { container } = renderWithQueryClient(
      <FloatingNotification {...defaultProps} duration={1000} />,
    );

    const progressBar = container.querySelector(".bg-primary");
    expect(progressBar).toBeInTheDocument();
  });

  it("hides progress bar when autoClose is false", () => {
    const { container } = renderWithQueryClient(
      <FloatingNotification {...defaultProps} autoClose={false} />,
    );

    const progressBar = container.querySelector(".bg-primary");
    expect(progressBar).not.toBeInTheDocument();
  });

  it("hides progress bar when duration is 0", () => {
    const { container } = renderWithQueryClient(
      <FloatingNotification {...defaultProps} duration={0} />,
    );

    const progressBar = container.querySelector(".bg-primary");
    expect(progressBar).not.toBeInTheDocument();
  });
});

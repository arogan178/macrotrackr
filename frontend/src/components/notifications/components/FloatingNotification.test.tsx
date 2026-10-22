import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("announces politely, and interrupts only for an error", () => {
    const { rerender } = renderWithQueryClient(
      <FloatingNotification {...defaultProps} />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    rerender(<FloatingNotification {...defaultProps} type="error" />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("waits while the pointer is on it", () => {
    renderWithQueryClient(<FloatingNotification {...defaultProps} duration={1000} />);
    act(() => {
      vi.advanceTimersByTime(20);
    });

    fireEvent.mouseEnter(screen.getByRole("status"));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(mockOnClose).not.toHaveBeenCalled();

    fireEvent.mouseLeave(screen.getByRole("status"));
    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
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

  it("runs the action and closes when its button is pressed", () => {
    const onUndo = vi.fn();
    renderWithQueryClient(
      <FloatingNotification
        {...defaultProps}
        action={{ label: "Undo", onClick: onUndo }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

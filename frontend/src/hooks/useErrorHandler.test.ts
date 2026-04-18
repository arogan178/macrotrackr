import { act,renderHook } from "@testing-library/react";

import { useErrorHandler, useQueryErrorHandler } from "./useErrorHandler";

describe("useErrorHandler", () => {
  describe("handleError", () => {
    it("should return error message from Error object", () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error("Test error message");
      const message = result.current.handleError(error);
      expect(message).toBe("Test error message");
    });

    it("should return string error message", () => {
      const { result } = renderHook(() => useErrorHandler());
      const message = result.current.handleError("String error");
      expect(message).toBe("String error");
    });

    it("should return fallback message when provided", () => {
      const { result } = renderHook(() =>
        useErrorHandler({ fallbackMessage: "Fallback" }),
      );
      const message = result.current.handleError(new Error("Original"));
      expect(message).toBe("Fallback");
    });

    it("should call onError callback when provided", () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useErrorHandler({ onError }));
      const error = new Error("Test");

      result.current.handleError(error);

      expect(onError).toHaveBeenCalledWith(error, "Test");
    });

    it("should not log error when logError is false", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() => useErrorHandler({ logError: false }));

      result.current.handleError(new Error("Test"));

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should log error when logError is true (default)", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() => useErrorHandler({ logError: true }));

      result.current.handleError(new Error("Test"));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("handleAsyncError", () => {
    it("should handle async function success", async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockFunction = vi.fn().mockResolvedValue(undefined);

      await act(async () => {
        await result.current.handleAsyncError(mockFunction);
      });

      expect(mockFunction).toHaveBeenCalled();
    });

    it("should handle async function error", async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockFunction = vi.fn().mockRejectedValue(new Error("Async error"));
      const errorCallback = vi.fn();

      await act(async () => {
        await result.current.handleAsyncError(mockFunction, errorCallback);
      });

      expect(errorCallback).toHaveBeenCalledWith("Async error");
    });
  });
});

describe("useQueryErrorHandler", () => {
  describe("handleQueryError", () => {
    it("should return error message", () => {
      const { result } = renderHook(() => useQueryErrorHandler());
      const message = result.current.handleQueryError(new Error("Query error"));
      expect(message).toBe("Query error");
    });

    it("should log query key when provided", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() => useQueryErrorHandler());
      const queryKey = ["users", "123"];

      result.current.handleQueryError(new Error("Query error"), queryKey);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Query error for key [users, 123]:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});

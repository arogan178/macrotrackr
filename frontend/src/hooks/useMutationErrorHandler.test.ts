import { renderHook } from "@testing-library/react";

import { useMutationErrorHandler, useOptimisticMutationHandler } from "./useMutationErrorHandler";

describe("useMutationErrorHandler", () => {
  describe("handleMutationError", () => {
    it("should return error message from Error object", () => {
      const { result } = renderHook(() => useMutationErrorHandler());
      const error = new Error("Mutation error");
      const message = result.current.handleMutationError(error);
      expect(message).toBe("Mutation error");
    });

    it("should return string error message", () => {
      const { result } = renderHook(() => useMutationErrorHandler());
      const message = result.current.handleMutationError("String error");
      expect(message).toBe("String error");
    });

    it("should call onError callback when provided", () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useMutationErrorHandler({ onError }),
      );
      const error = new Error("Test");

      result.current.handleMutationError(error);

      expect(onError).toHaveBeenCalledWith("Test");
    });

    it("should include context in error logging", () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useMutationErrorHandler({ onError, logError: false }),
      );

      result.current.handleMutationError(new Error("Test"), "saveUser");

      expect(onError).toHaveBeenCalledWith("Test");
    });
  });

  describe("handleMutationSuccess", () => {
    it("should call onSuccess with default message", () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useMutationErrorHandler({ onSuccess }),
      );

      result.current.handleMutationSuccess();

      expect(onSuccess).toHaveBeenCalledWith("Operation completed successfully");
    });

    it("should call onSuccess with custom message", () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useMutationErrorHandler({ onSuccess }),
      );

      result.current.handleMutationSuccess("Custom success");

      expect(onSuccess).toHaveBeenCalledWith("Custom success");
    });

    it("should not show success when showSuccess is false", () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useMutationErrorHandler({ onSuccess, showSuccess: false }),
      );

      result.current.handleMutationSuccess("Test");

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("createMutationHandlers", () => {
    it("should create handlers with context", () => {
      const { result } = renderHook(() => useMutationErrorHandler());
      const handlers = result.current.createMutationHandlers("saveData");

      expect(handlers.onError).toBeDefined();
      expect(handlers.onSuccess).toBeDefined();
    });
  });
});

describe("useOptimisticMutationHandler", () => {
  describe("createOptimisticHandlers", () => {
    it("should create optimistic error handler with rollback", () => {
      const rollbackFunction = vi.fn();
      const { result } = renderHook(() => useOptimisticMutationHandler());
      const handlers = result.current.createOptimisticHandlers(rollbackFunction, "update");

      handlers.onError(new Error("Error"), {}, { previousValue: "test" });

      expect(rollbackFunction).toHaveBeenCalledWith({ previousValue: "test" });
    });

    it("should create optimistic success handler", () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useOptimisticMutationHandler({ onSuccess }),
      );
      const handlers = result.current.createOptimisticHandlers();

      handlers.onSuccess({ data: "result" }, {}, undefined);

      expect(onSuccess).toHaveBeenCalledWith("Operation completed successfully");
    });
  });
});

import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  arrayOptimisticUpdates,
  createOptimisticMutationCallbacks,
  createOptimisticUpdate,
  errorClassification,
  objectOptimisticUpdates,
  rollbackOptimisticUpdate,
} from "../optimisticUpdates";

describe("optimisticUpdates", () => {
  let queryClient: QueryClient;
  const testQueryKey = ["test", "data"];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe("createOptimisticUpdate", () => {
    it("should create optimistic update and return context", () => {
      const initialData = [{ id: 1, name: "Item 1" }];
      queryClient.setQueryData(testQueryKey, initialData);

      const updateFunction = (oldData: any[], variables: any) => [
        ...oldData,
        { id: 2, name: variables.name },
      ];

      const context = createOptimisticUpdate({
        queryClient,
        queryKey: testQueryKey,
        updateFn: updateFunction,
        variables: { name: "Item 2" },
      });

      expect(context.previousData).toEqual(initialData);
      expect(context.queryKey).toEqual(testQueryKey);

      const updatedData = queryClient.getQueryData(testQueryKey);
      expect(updatedData).toEqual([
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ]);
    });

    it("should handle undefined previous data", () => {
      const updateFunction = (oldData: any[], variables: any) => [
        { id: 1, name: variables.name },
      ];

      const context = createOptimisticUpdate({
        queryClient,
        queryKey: testQueryKey,
        updateFn: updateFunction,
        variables: { name: "Item 1" },
      });

      expect(context.previousData).toBeUndefined();
      expect(queryClient.getQueryData(testQueryKey)).toEqual([
        { id: 1, name: "Item 1" },
      ]);
    });
  });

  describe("rollbackOptimisticUpdate", () => {
    it("should rollback to previous data", () => {
      const initialData = [{ id: 1, name: "Item 1" }];
      queryClient.setQueryData(testQueryKey, initialData);

      // Simulate optimistic update
      const updatedData = [...initialData, { id: 2, name: "Item 2" }];
      queryClient.setQueryData(testQueryKey, updatedData);

      const context = {
        previousData: initialData,
        queryKey: testQueryKey,
      };

      rollbackOptimisticUpdate(queryClient, context);

      expect(queryClient.getQueryData(testQueryKey)).toEqual(initialData);
    });

    it("should remove query data when previous data was undefined", () => {
      queryClient.setQueryData(testQueryKey, [{ id: 1, name: "Item 1" }]);

      const context = {
        previousData: undefined,
        queryKey: testQueryKey,
      };

      rollbackOptimisticUpdate(queryClient, context);

      expect(queryClient.getQueryData(testQueryKey)).toBeUndefined();
    });
  });

  describe("createOptimisticMutationCallbacks", () => {
    it("should create proper mutation callbacks", async () => {
      const initialData = [{ id: 1, name: "Item 1" }];
      queryClient.setQueryData(testQueryKey, initialData);

      const updateFunction = vi.fn((oldData: any[], variables: any) => [
        ...oldData,
        { id: 2, name: variables.name },
      ]);

      const onSuccessCallback = vi.fn();
      const onErrorCallback = vi.fn();

      const callbacks = createOptimisticMutationCallbacks({
        queryClient,
        queryKey: testQueryKey,
        updateFn: updateFunction,
        invalidateQueries: [testQueryKey],
        onSuccessCallback,
        onErrorCallback,
      });

      // Test onMutate
      const context = await callbacks.onMutate?.({ name: "Item 2" });
      expect(updateFunction).toHaveBeenCalled();
      expect(context?.previousData).toEqual(initialData);

      // Test onSuccess
      callbacks.onSuccess?.(
        { success: true },
        { name: "Item 2" },
        context as any
      );
      expect(onSuccessCallback).toHaveBeenCalled();

      // Test onError
      const error = new Error("Test error");
      callbacks.onError?.(error, { name: "Item 2" }, context as any);
      expect(onErrorCallback).toHaveBeenCalledWith(
        error,
        { name: "Item 2" },
        context
      );
      expect(queryClient.getQueryData(testQueryKey)).toEqual(initialData);
    });
  });

  describe("arrayOptimisticUpdates", () => {
    it("should add items to array", () => {
      const array = [{ id: 1 }, { id: 2 }];
      const result = arrayOptimisticUpdates.add(array, { id: 3 });
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it("should remove items from array", () => {
      const array = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = arrayOptimisticUpdates.remove(
        array,
        (item) => item.id === 2
      );
      expect(result).toEqual([{ id: 1 }, { id: 3 }]);
    });

    it("should update items in array", () => {
      const array = [{ id: 1, name: "A" }, { id: 2, name: "B" }];
      const result = arrayOptimisticUpdates.update(
        array,
        (item) => item.id === 1,
        (item) => ({ ...item, name: "Updated A" })
      );
      expect(result).toEqual([
        { id: 1, name: "Updated A" },
        { id: 2, name: "B" },
      ]);
    });

    it("should replace entire array", () => {
      const array = [{ id: 1 }, { id: 2 }];
      const newArray = [{ id: 3 }, { id: 4 }];
      const result = arrayOptimisticUpdates.replace(array, newArray);
      expect(result).toEqual(newArray);
    });

    it("should handle undefined arrays", () => {
      expect(arrayOptimisticUpdates.add(undefined, { id: 1 })).toEqual([
        { id: 1 },
      ]);
      expect(arrayOptimisticUpdates.remove(undefined, () => true)).toEqual([]);
      expect(arrayOptimisticUpdates.update(undefined, () => true, (x) => x)).toEqual([]);
    });
  });

  describe("objectOptimisticUpdates", () => {
    it("should update object properties", () => {
      const object = { id: 1, name: "Original", value: 100 };
      const result = objectOptimisticUpdates.update(object, {
        name: "Updated",
        value: 200,
      });
      expect(result).toEqual({ id: 1, name: "Updated", value: 200 });
    });

    it("should replace entire object", () => {
      const object = { id: 1, name: "Original" };
      const newObject = { id: 2, name: "New" };
      const result = objectOptimisticUpdates.replace(object, newObject);
      expect(result).toEqual(newObject);
    });

    it("should handle undefined objects", () => {
      const updates = { id: 1, name: "New" };
      const result = objectOptimisticUpdates.update(undefined, updates);
      expect(result).toEqual(updates);
    });
  });

  describe("errorClassification", () => {
    it("should identify network errors", () => {
      expect(errorClassification.isNetworkError(new Error("fetch failed"))).toBe(true);
      expect(errorClassification.isNetworkError(new Error("network error"))).toBe(true);
      
      const networkError = new Error("");
      networkError.name = "NetworkError";
      expect(errorClassification.isNetworkError(networkError)).toBe(true);
      
      const typeError = new Error("");
      typeError.name = "TypeError";
      expect(errorClassification.isNetworkError(typeError)).toBe(true);
      
      expect(errorClassification.isNetworkError(new Error("other error"))).toBe(false);
    });

    it("should identify server errors", () => {
      const serverError = Object.assign(new Error("Server error"), { status: 500 });
      expect(errorClassification.isServerError(serverError)).toBe(true);

      const clientError = Object.assign(new Error("Client error"), { status: 400 });
      expect(errorClassification.isServerError(clientError)).toBe(false);
    });

    it("should identify rate limit errors", () => {
      const rateLimitError = Object.assign(new Error("Too many requests"), { status: 429 });
      expect(errorClassification.isRateLimitError(rateLimitError)).toBe(true);

      const otherError = Object.assign(new Error("Bad request"), { status: 400 });
      expect(errorClassification.isRateLimitError(otherError)).toBe(false);
    });

    it("should identify non-retryable errors", () => {
      const authError = Object.assign(new Error("Unauthorized"), { status: 401 });
      expect(errorClassification.isNonRetryableError(authError)).toBe(true);

      const validationError = Object.assign(new Error("Bad request"), { status: 400 });
      expect(errorClassification.isNonRetryableError(validationError)).toBe(true);

      const serverError = Object.assign(new Error("Server error"), { status: 500 });
      expect(errorClassification.isNonRetryableError(serverError)).toBe(false);
    });
  });
});
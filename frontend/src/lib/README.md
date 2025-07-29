# TanStack Query Optimistic Updates and Retry Logic

This directory contains enhanced utilities for implementing optimistic updates and retry logic with TanStack Query mutations.

## Overview

The implementation provides:

1. **Enhanced QueryClient Configuration** - Sophisticated retry logic with exponential backoff
2. **Optimistic Updates Utilities** - Reusable patterns for optimistic UI updates
3. **Comprehensive Error Handling** - Intelligent error classification and retry strategies
4. **Rollback Mechanisms** - Automatic rollback of failed optimistic updates

## Files

### `queryClient.ts`
Enhanced QueryClient configuration with:
- **Intelligent Retry Logic**: Different retry strategies based on error type
- **Exponential Backoff with Jitter**: Prevents thundering herd problems
- **Error-Specific Handling**: Custom logic for auth, validation, rate limiting, and network errors
- **Query-Specific Configurations**: Different cache and retry settings per feature

### `optimisticUpdates.ts`
Utilities for implementing optimistic updates:
- **`createOptimisticUpdate`**: Creates optimistic updates with context for rollback
- **`rollbackOptimisticUpdate`**: Rolls back failed optimistic updates
- **`createOptimisticMutationCallbacks`**: Standardized mutation callbacks
- **Array/Object Update Utilities**: Common patterns for data manipulation
- **Error Classification**: Utilities to identify different error types

### `mutationErrorHandling.ts`
Comprehensive error handling system:
- **Retry Configuration**: Predefined configs for different operation types
- **Error Classification**: Functions to identify retryable vs non-retryable errors
- **MutationErrorHandler**: Centralized error handling with logging and notifications
- **Delay Calculation**: Sophisticated retry delay calculation with jitter

## Usage Examples

### Basic Optimistic Update

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOptimisticUpdate, rollbackOptimisticUpdate } from "@/lib/optimisticUpdates";

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiService.deleteItem(id);
    },
    onMutate: async (id: string) => {
      const context = createOptimisticUpdate({
        queryClient,
        queryKey: ['items'],
        updateFn: (oldData: Item[], variables) => 
          oldData?.filter(item => item.id !== variables) || [],
        variables: id,
      });
      return context;
    },
    onError: (error, variables, context) => {
      if (context) {
        rollbackOptimisticUpdate(queryClient, context);
      }
      console.error("Error deleting item:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

### Using Standardized Mutation Callbacks

```typescript
import { createOptimisticMutationCallbacks, arrayOptimisticUpdates } from "@/lib/optimisticUpdates";

export function useAddItem() {
  const queryClient = useQueryClient();

  const callbacks = createOptimisticMutationCallbacks({
    queryClient,
    queryKey: ['items'],
    updateFn: (oldData: Item[], variables: CreateItemData) => 
      arrayOptimisticUpdates.add(oldData, { 
        id: `temp-${Date.now()}`, 
        ...variables 
      }),
    invalidateQueries: [['items']],
    onSuccessCallback: (data, variables, context) => {
      // Custom success handling
      console.log("Item added successfully:", data);
    },
  });

  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      return await apiService.createItem(data);
    },
    ...callbacks,
  });
}
```

### Enhanced Error Handling

```typescript
import { 
  createMutationErrorHandler, 
  createStandardMutationOptions,
  retryConfigs 
} from "@/lib/mutationErrorHandling";

export function useCriticalOperation() {
  const queryClient = useQueryClient();
  
  const errorHandler = createMutationErrorHandler({
    queryClient,
    showNotification: true,
    onError: (error) => {
      // Custom error handling
      if (error.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      }
    },
  });

  const mutationOptions = createStandardMutationOptions({
    retryConfig: retryConfigs.critical, // Conservative retry for critical ops
    errorHandler,
    operation: 'criticalOperation',
  });

  return useMutation({
    mutationFn: async (data: CriticalData) => {
      return await apiService.performCriticalOperation(data);
    },
    ...mutationOptions,
  });
}
```

## Retry Strategies

### Query Retry Logic
- **Authentication Errors (401, 403)**: Never retry
- **Validation Errors (400, 422)**: Never retry  
- **Not Found (404)**: Never retry
- **Rate Limiting (429)**: Retry up to 5 times with longer delays
- **Server Errors (5xx)**: Retry up to 5 times
- **Network Errors**: Retry up to 5 times with exponential backoff
- **Other Errors**: Retry up to 3 times

### Mutation Retry Logic
- **Authentication Errors**: Never retry
- **Validation Errors**: Never retry
- **Rate Limiting**: Retry up to 3 times
- **Server Errors**: Retry up to 3 times
- **Network Errors**: Retry up to 3 times
- **Other Errors**: Retry once

### Retry Configurations

```typescript
// Conservative for critical operations (auth, payments)
retryConfigs.critical = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
}

// Balanced for standard CRUD operations
retryConfigs.standard = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.2,
}

// Aggressive for background operations
retryConfigs.background = {
  maxRetries: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.3,
}
```

## Exponential Backoff with Jitter

The retry delay calculation includes:
- **Exponential Backoff**: `baseDelay * (backoffMultiplier ^ attemptIndex)`
- **Maximum Delay Cap**: Prevents excessively long delays
- **Jitter**: Random variation to prevent thundering herd
- **Special Handling**: Longer delays for rate limiting errors

## Error Classification

The system automatically classifies errors to determine retry behavior:

- **Network Errors**: Connection issues, fetch failures, timeouts
- **Server Errors**: 5xx status codes indicating server problems
- **Rate Limiting**: 429 status code requiring backoff
- **Authentication**: 401/403 requiring user intervention
- **Validation**: 400/422 indicating client-side issues
- **Conflicts**: 409 indicating business logic violations

## Best Practices

1. **Use Optimistic Updates for Frequent Operations**: Habits progress, macro entries, etc.
2. **Implement Proper Rollback**: Always provide rollback mechanisms for optimistic updates
3. **Choose Appropriate Retry Configs**: Use conservative configs for critical operations
4. **Handle Errors Gracefully**: Provide user-friendly error messages
5. **Test Rollback Scenarios**: Ensure optimistic updates can be properly rolled back
6. **Monitor Retry Patterns**: Log retry attempts to identify systemic issues

## Testing

The implementation includes comprehensive tests covering:
- Optimistic update creation and rollback
- Error classification accuracy
- Retry logic behavior
- Mutation callback generation
- Array and object update utilities

Run tests with:
```bash
bun test ./src/lib/__tests__/optimisticUpdates.test.ts --run
bun test ./src/lib/__tests__/mutationErrorHandling.test.ts --run
```

## Migration Notes

When migrating existing mutations:

1. **Add Optimistic Updates**: For mutations that benefit from immediate feedback
2. **Update Error Handling**: Use the new error classification system
3. **Configure Retries**: Choose appropriate retry configurations
4. **Test Rollback**: Ensure failed optimistic updates roll back correctly
5. **Monitor Performance**: Watch for improved user experience and reduced error rates
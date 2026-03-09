// Error handling hooks
export { useErrorHandler, useQueryErrorHandler } from "./useErrorHandler";
export {
  useMutationErrorHandler,
  useOptimisticMutationHandler,
} from "./useMutationErrorHandler";

// Loading state hooks
export {
  type FeatureType,
  useFeatureLoading,
  useMultiFeatureLoading,
  useSpecificMutationLoading,
  useSpecificQueryLoading,
} from "./useFeatureLoading";
export { useCriticalLoading, useGlobalLoading } from "./useGlobalLoading";

// Subscription hooks
export { useSubscriptionStatus } from "./useSubscriptionStatus";

// Animation hooks
export { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// Performance monitoring hooks
export { useRenderCount } from "./useRenderCount";

// Other hooks
export { default as useBeforeUnload } from "./useBeforeUnload";

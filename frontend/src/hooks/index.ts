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

// Other hooks
export { default as useBeforeUnload } from "./useBeforeUnload";

// Error handling hooks
export { useErrorHandler, useQueryErrorHandler } from "./useErrorHandler";
export { 
  useMutationErrorHandler, 
  useOptimisticMutationHandler 
} from "./useMutationErrorHandler";

// Loading state hooks
export { useGlobalLoading, useCriticalLoading } from "./useGlobalLoading";
export { 
  useFeatureLoading, 
  useSpecificQueryLoading, 
  useSpecificMutationLoading,
  useMultiFeatureLoading,
  type FeatureType
} from "./useFeatureLoading";

// Other hooks
export { default as useBeforeUnload } from "./useBeforeUnload";
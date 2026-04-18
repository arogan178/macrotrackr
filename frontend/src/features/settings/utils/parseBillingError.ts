// Utility to parse billing errors for user-friendly messages
const parseBillingError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("network") || message.includes("fetch"))
    return {
      type: "network",
      message:
        "Network connection issue. Please check your internet connection.",
      retryable: true,
    };
  if (message.includes("stripe") || message.includes("payment"))
    return {
      type: "stripe",
      message: "Payment service temporarily unavailable. Please try again.",
      retryable: true,
    };
  if (message.includes("auth") || message.includes("unauthorized"))
    return {
      type: "auth",
      message: "Authentication required. Please refresh and try again.",
      retryable: false,
    };

  return {
    type: "unknown",
    message:
      error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again.",
    retryable: true,
  };
};

export default parseBillingError;

// Route loader for billing details
export async function billingLoader() {
  try {
    const response = await fetch("/api/billing/details", {
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        return {
          billingDetails: undefined,
          error: undefined,
          authRequired: true,
        };
      }
      return {
        billingDetails: undefined,
        error: response.statusText,
        authRequired: false,
      };
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {
        billingDetails: undefined,
        error: "Invalid response format",
        authRequired: false,
      };
    }
    const data = await response.json();
    return { billingDetails: data, error: undefined, authRequired: false };
  } catch {
    return {
      billingDetails: undefined,
      error: "Network error",
      authRequired: false,
    };
  }
}

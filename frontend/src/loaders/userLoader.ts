// Route loader for user profile data
export async function loader() {
  try {
    const response = await fetch("/api/user/me", {
      credentials: "include",
    });

    // If not authenticated, return gracefully without throwing
    if (!response.ok) {
      if (response.status === 401) {
        return { user: undefined, authRequired: true };
      }
      // For other errors, still return gracefully
      return {
        user: undefined,
        authRequired: false,
        error: response.statusText,
      };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {
        user: undefined,
        authRequired: false,
        error: "Invalid response format",
      };
    }

    const data = await response.json();
    return { user: data, authRequired: false };
  } catch (error) {
    // Network errors or other issues - return gracefully
    console.warn("Failed to load user profile:", error);
    return { user: undefined, authRequired: false, error: "Network error" };
  }
}

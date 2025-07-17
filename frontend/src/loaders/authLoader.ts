// frontend/src/loaders/authLoader.ts
import { apiService } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

export interface AuthLoaderResult {
  isAuthenticated: boolean;
  user: unknown | null;
  error?: string;
}

export async function authLoader(): Promise<AuthLoaderResult> {
  try {
    const user = await apiService.user.getUserDetails();
    return { isAuthenticated: true, user };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    // Handle specific auth error case
    if (errorMessage.includes("401")) {
      return { isAuthenticated: false, user: undefined };
    }
    // Handle other errors
    return { isAuthenticated: false, user: undefined, error: errorMessage };
  }
}

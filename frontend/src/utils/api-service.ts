/**
 * API Service - Centralizes API calls and standardizes error handling
 */

const API_BASE_URL = "http://localhost:3000";

/**
 * Handles API response and performs common error processing
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }
    
    // Try to extract error details from the response
    const errorData = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`
    }));
    
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Generates headers for API calls
 */
function getHeaders(includeContentType = true) {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("token");
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  
  return headers;
}

/**
 * Centralized API service with endpoint groups
 */
export const apiService = {
  // User endpoints
  user: {
    getProfile: async () => {
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    
    updateSettings: async (settings: any) => {
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(settings),
      });
      return handleResponse(response);
    }
  },
  
  // Authentication endpoints
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },
    
    register: async (userData: any) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-complete`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    
    validateEmail: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-email`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      return handleResponse(response);
    }
  },
  
  // Macro entry endpoints
  macros: {
    getDailyTotals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    
    getHistory: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macros/history`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    
    addEntry: async (entry: { protein: number; carbs: number; fats: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(entry),
      });
      return handleResponse(response);
    },
    
    updateEntry: async (id: number, entry: { protein: number; carbs: number; fats: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(entry),
      });
      return handleResponse(response);
    },
    
    deleteEntry: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry/${id}`, {
        method: "DELETE",
        headers: getHeaders(false),
      });
      return handleResponse(response);
    }
  }
};

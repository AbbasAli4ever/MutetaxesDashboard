import { AuthResponse, RefreshResponse, User } from "@/types/auth";
import Cookies from "js-cookie";

const API_BASE_URL = "http://localhost:3000";

// Cookie names
export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USER_DATA_KEY = "userData";

// Token expiry times (in days)
const ACCESS_TOKEN_EXPIRY = 8 / 24; // 8 hours in days
const REFRESH_TOKEN_EXPIRY = 7; // 7 days

// Set tokens in cookies
export const setTokens = (accessToken: string, refreshToken: string): void => {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: ACCESS_TOKEN_EXPIRY,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: REFRESH_TOKEN_EXPIRY,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// Get access token from cookies
export const getAccessToken = (): string | undefined => {
  return Cookies.get(ACCESS_TOKEN_KEY);
};

// Get refresh token from cookies
export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_TOKEN_KEY);
};

// Set user data in cookies
export const setUserData = (user: User): void => {
  Cookies.set(USER_DATA_KEY, JSON.stringify(user), {
    expires: REFRESH_TOKEN_EXPIRY,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// Get user data from cookies
export const getUserData = (): User | null => {
  const userData = Cookies.get(USER_DATA_KEY);
  if (userData) {
    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }
  return null;
};

// Clear all auth data from cookies
export const clearAuthData = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(USER_DATA_KEY);
};

// Login API call
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Login failed");
  }

  return response.json();
};

// Refresh token API call
export const refreshAccessToken = async (): Promise<RefreshResponse | null> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    const data: RefreshResponse = await response.json();

    if (data.success && data.accessToken) {
      // Update access token in cookies
      Cookies.set(ACCESS_TOKEN_KEY, data.accessToken, {
        expires: ACCESS_TOKEN_EXPIRY,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // If a new refresh token is provided, update it too
      if (data.refreshToken) {
        Cookies.set(REFRESH_TOKEN_KEY, data.refreshToken, {
          expires: REFRESH_TOKEN_EXPIRY,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
    }

    return data;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearAuthData();
    return null;
  }
};

// Check if token is expired (decode JWT without verification)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    // Consider token expired 1 minute before actual expiry
    return Date.now() >= exp - 60000;
  } catch {
    return true;
  }
};

// Get valid access token (refresh if needed)
export const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    const refreshResult = await refreshAccessToken();
    return refreshResult?.accessToken || null;
  }

  if (isTokenExpired(accessToken)) {
    const refreshResult = await refreshAccessToken();
    return refreshResult?.accessToken || null;
  }

  return accessToken;
};

// Authenticated fetch wrapper
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getValidAccessToken();

  if (!token) {
    throw new Error("No valid authentication token");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token and retry once
  if (response.status === 401) {
    const refreshResult = await refreshAccessToken();
    
    if (refreshResult?.accessToken) {
      headers.set("Authorization", `Bearer ${refreshResult.accessToken}`);
      return fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
};

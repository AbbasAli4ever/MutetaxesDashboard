"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthState, LoginCredentials } from "@/types/auth";
import {
  login as loginApi,
  setTokens,
  setUserData,
  getAccessToken,
  getUserData,
  clearAuthData,
  getValidAccessToken,
  refreshAccessToken,
  isTokenExpired,
  API_BASE_URL,
} from "@/lib/auth";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<string>;
  logout: () => void;
  getToken: () => Promise<string | null>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Map backend dashboardPath to actual frontend route
// Backend returns "/customer/dashboard" but frontend route is "/dashboard"
// Backend returns "/admin/dashboard" which matches frontend route directly
const resolveDashboardPath = (backendPath: string, userType: "ADMIN" | "CUSTOMER"): string => {
  if (userType === "CUSTOMER") return "/dashboard";
  if (userType === "ADMIN") return "/admin/dashboard";
  return backendPath;
};

// Fetch fresh user data from the server using GET /auth/me
const fetchCurrentUser = async (accessToken: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    // Backend returns either { user: {...} } or the user object directly
    return data.user ?? data;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from cookies on mount, then rehydrate from /auth/me
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let accessToken = getAccessToken();
        const cachedUser = getUserData();

        if (!accessToken && !cachedUser) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        // If token is expired, try to refresh first
        if (accessToken && isTokenExpired(accessToken)) {
          const refreshResult = await refreshAccessToken();
          if (refreshResult?.accessToken) {
            accessToken = refreshResult.accessToken;
          } else {
            clearAuthData();
            setState({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }
        }

        if (accessToken) {
          // Rehydrate from server to get fresh user.type, dashboardPath, permissions
          const freshUser = await fetchCurrentUser(accessToken);
          const user = freshUser ?? cachedUser;

          if (user) {
            // Persist fresh user data to cookie
            setUserData(user);
            setState({
              user,
              accessToken,
              refreshToken: null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            clearAuthData();
            setState({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  // Set up automatic token refresh every 5 minutes
  useEffect(() => {
    if (!state.isAuthenticated || !state.accessToken) return;

    const checkAndRefreshToken = async () => {
      if (state.accessToken && isTokenExpired(state.accessToken)) {
        const refreshResult = await refreshAccessToken();
        if (refreshResult?.accessToken) {
          setState((prev) => ({
            ...prev,
            accessToken: refreshResult.accessToken,
          }));
        } else {
          logout();
        }
      }
    };

    const intervalId = setInterval(checkAndRefreshToken, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [state.isAuthenticated, state.accessToken]);

  // Returns dashboardPath so the caller (SignInForm) can navigate immediately
  const login = useCallback(async (credentials: LoginCredentials): Promise<string> => {
    const response = await loginApi(credentials.email, credentials.password);

    if (response.success) {
      setTokens(response.accessToken, response.refreshToken);
      setUserData(response.user);

      setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      return resolveDashboardPath(response.user.dashboardPath, response.user.type);
    }

    throw new Error("Login failed");
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    if (typeof window !== "undefined") {
      localStorage.removeItem("dashboardRole");
    }
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return getValidAccessToken();
  }, []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!state.user?.permissions) return false;
      const normalizedPermission = permission.toUpperCase();
      return state.user.permissions.some(
        (p) => p.toUpperCase() === normalizedPermission
      );
    },
    [state.user?.permissions]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        getToken,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

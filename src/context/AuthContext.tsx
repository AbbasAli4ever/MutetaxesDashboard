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
} from "@/lib/auth";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
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

  // Initialize auth state from cookies on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = getAccessToken();
        const user = getUserData();

        if (accessToken && user) {
          // Check if token is expired and try to refresh
          if (isTokenExpired(accessToken)) {
            const refreshResult = await refreshAccessToken();
            if (refreshResult?.accessToken) {
              setState({
                user,
                accessToken: refreshResult.accessToken,
                refreshToken: null,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              // Refresh failed, clear auth
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
            setState({
              user,
              accessToken,
              refreshToken: null,
              isAuthenticated: true,
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

  // Set up automatic token refresh
  useEffect(() => {
    if (!state.isAuthenticated || !state.accessToken) return;

    // Check token expiry and refresh proactively
    const checkAndRefreshToken = async () => {
      if (state.accessToken && isTokenExpired(state.accessToken)) {
        const refreshResult = await refreshAccessToken();
        if (refreshResult?.accessToken) {
          setState((prev) => ({
            ...prev,
            accessToken: refreshResult.accessToken,
          }));
        } else {
          // Refresh failed, logout
          logout();
        }
      }
    };

    // Check every 5 minutes
    const intervalId = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [state.isAuthenticated, state.accessToken]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await loginApi(credentials.email, credentials.password);

      if (response.success) {
        // Save tokens to cookies
        setTokens(response.accessToken, response.refreshToken);
        // Save user data to cookies
        setUserData(response.user);

        setState({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
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
      // Case-insensitive permission check
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

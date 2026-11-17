import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { setUnauthorizedHandler } from "@/lib/api/client";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth/token";

import * as authApi from "../api";
import { AuthContext, AuthValue } from "../hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasToken, setHasToken] = useState(() => getAuthToken() !== null);

  const meQuery = useQuery({
    queryKey: authApi.meQueryKey,
    queryFn: authApi.fetchMe,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const resetSession = useCallback(() => {
    clearAuthToken();
    setHasToken(false);
    queryClient.clear();
  }, [queryClient]);

  // Expired/invalid token on any request: log out and go to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetSession();
      navigate("/login", {
        replace: true,
        state: { from: location.pathname, expired: true },
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, location.pathname, resetSession]);

  const loadMe = useCallback(async () => {
    setHasToken(true);
    return queryClient.fetchQuery({
      queryKey: authApi.meQueryKey,
      queryFn: authApi.fetchMe,
      staleTime: 0,
    });
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await authApi.login(email, password);
      setAuthToken(access_token);
      return loadMe();
    },
    [loadMe]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await authApi.register({ email, password });
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    resetSession();
    navigate("/", { replace: true });
  }, [navigate, resetSession]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: authApi.meQueryKey });
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      user: hasToken ? (meQuery.data ?? null) : null,
      isLoading: hasToken && meQuery.isPending,
      login,
      register,
      logout,
      refresh,
    }),
    [hasToken, meQuery.data, meQuery.isPending, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

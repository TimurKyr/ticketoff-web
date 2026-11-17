import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { setUnauthorizedHandler } from "@/lib/api/client";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth/token";

import * as authApi from "../api";
import { AuthContext, AuthValue } from "../hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [hasToken, setHasToken] = useState(() => getAuthToken() !== null);
  // Set when the API rejected our token; protected pages then show "session expired" on /login.
  const [sessionExpired, setSessionExpired] = useState(false);

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

  // Expired/invalid token on any request: only log out. Public pages stay where they are;
  // protected pages see `user == null` and <RequireAuth> sends the user to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetSession();
      setSessionExpired(true);
    });
    return () => setUnauthorizedHandler(null);
  }, [resetSession]);

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
      setSessionExpired(false);
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
      sessionExpired,
      login,
      register,
      logout,
      refresh,
    }),
    [hasToken, meQuery.data, meQuery.isPending, sessionExpired, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { createContext, useContext } from "react";

import type { MeOut } from "@/lib/api/types";

export interface AuthValue {
  /** Current user from GET /auth/me, null when logged out. */
  user: MeOut | null;
  /** True while the stored token is being checked. */
  isLoading: boolean;
  /** The API rejected the stored token (expired); cleared on the next login. */
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<MeOut>;
  register: (email: string, password: string) => Promise<MeOut>;
  logout: () => void;
  /** Re-read /auth/me (e.g. after becoming an organizer). */
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

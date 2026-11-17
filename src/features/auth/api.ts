import { apiClient } from "@/lib/api/client";
import type {
  MeOut,
  OrganizerProfileIn,
  OrganizerProfileOut,
  TokenOut,
  UserOut,
  UserRegister,
} from "@/lib/api/types";

export const meQueryKey = ["auth", "me"] as const;

export function fetchMe(): Promise<MeOut> {
  return apiClient.get<MeOut>("/auth/me");
}

/** POST /auth/login takes an OAuth2 form (username = email), not JSON. */
export function login(email: string, password: string): Promise<TokenOut> {
  return apiClient.postForm<TokenOut>("/auth/login", { username: email, password });
}

export function register(payload: UserRegister): Promise<UserOut> {
  return apiClient.post<UserOut>("/auth/register", payload);
}

export function createOrganizerProfile(
  payload: OrganizerProfileIn
): Promise<OrganizerProfileOut> {
  return apiClient.post<OrganizerProfileOut>("/organizer/profile", payload);
}

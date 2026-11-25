import { apiClient } from "@/lib/api/client";
import type {
  ForgotPasswordIn,
  MeOut,
  OrganizerProfileIn,
  OrganizerProfileOut,
  OrganizerProfileUpdate,
  ResetPasswordIn,
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

/** No login needed: the token from the email link says who it is. Repeating it is fine. */
export function verifyEmail(token: string): Promise<UserOut> {
  return apiClient.post<UserOut>("/auth/verify-email", { token });
}

/** A new verification link for the logged-in user; 429 when asked again within 60 s. */
export function resendVerificationEmail(): Promise<void> {
  return apiClient.post<void>("/auth/verify-email/resend");
}

export function createOrganizerProfile(
  payload: OrganizerProfileIn
): Promise<OrganizerProfileOut> {
  return apiClient.post<OrganizerProfileOut>("/organizer/profile", payload);
}


export const organizerProfileKey = ["organizer", "profile"] as const;

export function getOrganizerProfile(): Promise<OrganizerProfileOut> {
  return apiClient.get<OrganizerProfileOut>("/organizer/profile");
}

/** Partial: only the fields sent change; null clears a contact. */
export function updateOrganizerProfile(
  payload: OrganizerProfileUpdate
): Promise<OrganizerProfileOut> {
  return apiClient.patch<OrganizerProfileOut>("/organizer/profile", payload);
}
/** Always 204, whether or not the address has an account. */
export function requestPasswordReset(email: string): Promise<void> {
  const body: ForgotPasswordIn = { email };
  return apiClient.post<void>("/auth/forgot-password", body);
}

/** The link's token says who it is; a link works once. */
export function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  const body: ResetPasswordIn = { token, new_password: newPassword };
  return apiClient.post<void>("/auth/reset-password", body);
}

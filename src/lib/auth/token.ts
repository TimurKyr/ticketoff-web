// Access token storage. The token is never logged.
const TOKEN_KEY = "ticketoff.access_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage blocked (private mode): the session lasts until reload
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

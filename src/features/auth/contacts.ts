import type { MessageKey } from "@/lib/i18n";

/**
 * Client checks for the organizer's contacts, the same rules as the backend
 * (identity/schemas.py, BE-29), so the form says what is wrong before sending.
 * The server still decides; its messages come through errorMessage().
 */

export const WEBSITE_MAX = 255;
const PHONE_INPUT = /^\+?[0-9 ()-]+$/;
// The same simple shape the server accepts; the server's email check is the final word.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Checked = { value: string | null } | { error: MessageKey };

/** "" → null (clears the field); otherwise the trimmed email in lower case. */
export function checkEmail(input: string): Checked {
  const value = input.trim();
  if (!value) return { value: null };
  return EMAIL.test(value) ? { value: value.toLowerCase() } : { error: "err.emailInvalid" };
}

/**
 * The stored form, "+" and digits:
 * - "+..." is kept (10-15 digits);
 * - 11 digits starting with 8 → "+7" and the last 10 ("8 701 123 45 67" → "+77011234567");
 * - 10 digits starting with 7 → "+7" and those 10 ("701 123 45 67" → "+77011234567");
 * - anything else without "+" is refused (it would be a wrong number).
 */
export function checkPhone(input: string): Checked {
  const raw = input.trim();
  if (!raw) return { value: null };
  if (!PHONE_INPUT.test(raw) || raw.slice(1).includes("+")) return { error: "err.phoneChars" };
  const digits = raw.replace(/[^0-9]/g, "");
  if (raw.startsWith("+")) {
    return digits.length >= 10 && digits.length <= 15
      ? { value: `+${digits}` }
      : { error: "err.phoneDigits" };
  }
  if (digits.length === 11 && digits.startsWith("8")) return { value: `+7${digits.slice(1)}` };
  if (digits.length === 10 && digits.startsWith("7")) return { value: `+7${digits}` };
  return { error: "err.phoneInternational" };
}

/** An http(s) address with a host, at most 255 characters; kept as typed (trimmed). */
export function checkWebsite(input: string): Checked {
  const value = input.trim();
  if (!value) return { value: null };
  if (value.length > WEBSITE_MAX) return { error: "err.websiteLong" };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: "err.websiteHttp" };
  }
  const ok = (url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "" && !/\s/.test(value);
  return ok ? { value } : { error: "err.websiteHttp" };
}

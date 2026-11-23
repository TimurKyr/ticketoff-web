import { describe, expect, it } from "vitest";

import type { MessageKey } from "@/lib/i18n";

import { ApiError } from "./client";
import { errorMessage, isEmailNotVerified } from "./errors";

const t = (key: MessageKey) => key;
const notVerified = new ApiError(403, {
  detail: "Confirm your email address first: open the link we emailed you",
  code: "EMAIL_NOT_VERIFIED",
});

describe("isEmailNotVerified", () => {
  it("is true only for 403 with code EMAIL_NOT_VERIFIED", () => {
    expect(isEmailNotVerified(notVerified)).toBe(true);
    expect(isEmailNotVerified(new ApiError(403, { detail: "Forbidden" }))).toBe(false);
    expect(isEmailNotVerified(new ApiError(409, { detail: "x", code: "EMAIL_NOT_VERIFIED" }))).toBe(false);
    expect(isEmailNotVerified(new Error("nope"))).toBe(false);
  });
});

describe("errorMessage", () => {
  it("translates EMAIL_NOT_VERIFIED by code, not by the English detail", () => {
    expect(errorMessage(notVerified, t)).toBe("err.emailNotVerified");
  });

  it("keeps other errors as before", () => {
    expect(errorMessage(new ApiError(403, { detail: "Some other reason" }), t)).toBe(
      "Some other reason"
    );
  });
});

describe("ApiError.code", () => {
  it("reads a string code and ignores anything else", () => {
    expect(notVerified.code).toBe("EMAIL_NOT_VERIFIED");
    expect(new ApiError(400, { detail: "x", code: 5 }).code).toBeUndefined();
    expect(new ApiError(400, null).code).toBeUndefined();
  });
});

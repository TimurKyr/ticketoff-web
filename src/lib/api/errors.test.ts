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

describe("errorMessage, FE-22", () => {
  it("translates the sales suspension and capacity messages", () => {
    expect(
      errorMessage(new ApiError(409, { detail: "Sales are suspended for this event by the platform" }), t)
    ).toBe("err.salesSuspended");
    const tr = (key: MessageKey) => (key === "err.capacityExceeded" ? "всего $1 из $2" : key);
    expect(
      errorMessage(new ApiError(409, { detail: "Total ticket quantity (90) exceeds event capacity (80)" }), tr)
    ).toBe("всего 90 из 80");
  });

  it("drops the field name from a translated validation error, keeps it otherwise", () => {
    const error = new ApiError(422, {
      detail: [
        { loc: ["body", "email"], msg: "value is not a valid email address: An email address must have an @-sign." },
        { loc: ["body", "name"], msg: "Field required" },
      ],
    });
    expect(errorMessage(error, t)).toBe("err.emailInvalid; name: Field required");
  });
});

describe("ApiError.code", () => {
  it("reads a string code and ignores anything else", () => {
    expect(notVerified.code).toBe("EMAIL_NOT_VERIFIED");
    expect(new ApiError(400, { detail: "x", code: 5 }).code).toBeUndefined();
    expect(new ApiError(400, null).code).toBeUndefined();
  });
});

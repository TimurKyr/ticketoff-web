import { describe, expect, it } from "vitest";

import { checkEmail, checkPhone, checkWebsite } from "./contacts";

describe("checkPhone (same rules as the backend)", () => {
  it.each([
    ["+7 (701) 123-45-67", "+77011234567"],
    ["+44 20 7946 0958", "+442079460958"],
    ["8 701 123 45 67", "+77011234567"],
    ["8(701)123-45-67", "+77011234567"],
    ["701 123 45 67", "+77011234567"],
    ["", null],
    ["   ", null],
  ])("%s → %s", (input, stored) => {
    expect(checkPhone(input)).toEqual({ value: stored });
  });

  it.each([
    ["8 701 123 45 6", "err.phoneInternational"],
    ["601 123 45 67", "err.phoneInternational"],
    ["77 701 123 45 67", "err.phoneInternational"],
    ["+7 701", "err.phoneDigits"],
    ["+7 701 CALL", "err.phoneChars"],
    ["7+7011234567", "err.phoneChars"],
  ])("%s is refused (%s)", (input, error) => {
    expect(checkPhone(input)).toEqual({ error });
  });
});

describe("checkEmail and checkWebsite", () => {
  it("lower-cases an email and clears an empty one", () => {
    expect(checkEmail(" Info@Jazz.KZ ")).toEqual({ value: "info@jazz.kz" });
    expect(checkEmail("")).toEqual({ value: null });
    expect(checkEmail("nope")).toEqual({ error: "err.emailInvalid" });
  });

  it("accepts only http(s) addresses", () => {
    expect(checkWebsite(" https://jazz.kz/a ")).toEqual({ value: "https://jazz.kz/a" });
    expect(checkWebsite("ftp://jazz.kz")).toEqual({ error: "err.websiteHttp" });
    expect(checkWebsite("jazz.kz")).toEqual({ value: "https://jazz.kz" });
    expect(checkWebsite("www.jazz.kz/afisha")).toEqual({ value: "https://www.jazz.kz/afisha" });
    expect(checkWebsite("jazz kz")).toEqual({ error: "err.websiteHttp" });
    expect(checkWebsite(`https://jazz.kz/${"a".repeat(260)}`)).toEqual({ error: "err.websiteLong" });
  });
});

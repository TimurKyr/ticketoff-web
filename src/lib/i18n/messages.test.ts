import { describe, expect, it } from "vitest";

import { LANGUAGE_LABELS, LANGUAGES, en, kk, ru, type MessageKey } from "./messages";

const ruKeys = Object.keys(ru) as MessageKey[];

/** "{price}", "$1": the parts the code replaces, which every translation must keep. */
function placeholders(text: string): string[] {
  return (text.match(/\{\w+\}|\$\d/g) ?? []).sort();
}

describe("messages", () => {
  it("en has every ru key, with a non-empty text", () => {
    const missing = ruKeys.filter((key) => !en[key]?.trim());
    expect(missing).toEqual([]);
  });

  it("en has no keys that ru does not have", () => {
    const extra = Object.keys(en).filter((key) => !(key in ru));
    expect(extra).toEqual([]);
  });

  it("en keeps the placeholders of ru", () => {
    const broken = ruKeys.filter(
      (key) => placeholders(en[key]).join() !== placeholders(ru[key]).join()
    );
    expect(broken).toEqual([]);
  });

  it("en has no Cyrillic", () => {
    const cyrillic = ruKeys.filter((key) => /[Ѐ-ӿ]/.test(en[key]));
    expect(cyrillic).toEqual([]);
  });

  it("kk may be partial (falls back to ru): only reports what is missing", () => {
    const missing = ruKeys.filter((key) => !(key in kk));
    if (missing.length) console.info(`kk: ${missing.length} of ${ruKeys.length} keys fall back to ru`);
    expect(missing.length).toBeLessThan(ruKeys.length);
  });

  it("the switcher lists Қаз · Рус · Eng", () => {
    expect(Object.keys(LANGUAGES)).toEqual(["kk", "ru", "en"]);
    expect(Object.keys(LANGUAGES).map((code) => LANGUAGE_LABELS[code as keyof typeof LANGUAGES])).toEqual([
      "Қаз",
      "Рус",
      "Eng",
    ]);
  });
});

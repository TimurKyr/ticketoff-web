import { createContext, useContext } from "react";

import type { Language, MessageKey } from "./messages";

export interface I18nValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: MessageKey) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

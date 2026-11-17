import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { I18nContext } from "./context";
import { LANGUAGES, Language, MessageKey, ru } from "./messages";

const LANG_KEY = "ticketoff.lang";

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && saved in LANGUAGES) return saved as Language;
  } catch {
    // storage blocked
  }
  return "ru";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // storage blocked
    }
  }, []);

  const t = useCallback(
    (key: MessageKey) => LANGUAGES[lang][key] ?? ru[key],
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

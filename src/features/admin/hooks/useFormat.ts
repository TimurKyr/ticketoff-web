import { useI18n } from "@/lib/i18n";

const LOCALES: Record<string, string> = { ru: "ru-RU", kk: "kk-KZ" };

/** Money as `5 000 ₸` and dates in the current UI language. */
export function useFormat() {
  const { lang } = useI18n();
  const locale = LOCALES[lang] ?? "ru-RU";
  return {
    money: (kzt: number) => `${new Intl.NumberFormat(locale).format(kzt)}\u00A0₸`,
    date: (iso: string) =>
      new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" }),
  };
}

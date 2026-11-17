import { Link } from "react-router-dom";

import { useI18n } from "@/lib/i18n";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <section>
      <h1 className="mb-2 text-xl font-semibold">{t("notFound.title")}</h1>
      <Link to="/" className="underline">
        {t("notFound.home")}
      </Link>
    </section>
  );
}

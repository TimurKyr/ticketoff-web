import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

/** Previous / "Страница N из M" / next. Disabled while the next page is loading. */
export function Pager({
  page,
  pages,
  busy,
  onPage,
}: {
  page: number;
  pages: number;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  const { t } = useI18n();
  if (pages <= 1) return null;
  return (
    <nav aria-label={t("events.page")} className="flex items-center gap-3">
      <Button variant="secondary" disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>
        {t("events.prev")}
      </Button>
      <span className="text-sm">
        {t("events.page")} {page} {t("events.of")} {pages}
      </span>
      <Button variant="secondary" disabled={page >= pages || busy} onClick={() => onPage(page + 1)}>
        {t("events.next")}
      </Button>
    </nav>
  );
}

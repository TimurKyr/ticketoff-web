import { useI18n } from "@/lib/i18n";

interface PagerProps {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}

export function Pager({ total, limit, offset, onChange }: PagerProps) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.floor(offset / limit) + 1;
  if (pages <= 1) return null;

  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <button
        type="button"
        className="rounded border px-3 py-1 disabled:opacity-50"
        disabled={offset <= 0}
        onClick={() => onChange(Math.max(0, offset - limit))}
      >
        {t("events.prev")}
      </button>
      <span>
        {t("events.page")} {page} {t("events.of")} {pages}
      </span>
      <button
        type="button"
        className="rounded border px-3 py-1 disabled:opacity-50"
        disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}
      >
        {t("events.next")}
      </button>
    </div>
  );
}

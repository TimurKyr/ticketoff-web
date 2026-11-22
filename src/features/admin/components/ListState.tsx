import type { ReactNode } from "react";

import { useI18n } from "@/lib/i18n";

import { errorText } from "../errors";

interface ListStateProps {
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  isEmpty: boolean;
  emptyText?: string;
  children: ReactNode;
}

/** Loading / error / empty wrapper shared by all admin lists. */
export function ListState({ isLoading, error, onRetry, isEmpty, emptyText, children }: ListStateProps) {
  const { t } = useI18n();

  if (error) {
    return (
      <div role="alert" className="text-sm text-red-700">
        <p>{errorText(error, t)}</p>
        <button type="button" className="mt-2 rounded border px-3 py-1" onClick={onRetry}>
          {t("common.retry")}
        </button>
      </div>
    );
  }
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-gray-600">
        {t("common.loading")}
      </p>
    );
  }
  if (isEmpty) {
    return <p className="text-sm text-gray-600">{emptyText ?? t("admin.list.empty")}</p>;
  }
  return <>{children}</>;
}

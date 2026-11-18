import { ReactNode } from "react";

import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

import { Alert } from "./Alert";
import { Button } from "./Button";

export function Loading() {
  const { t } = useI18n();
  return (
    <p role="status" className="py-6 text-sm text-gray-600">
      {t("common.loading")}
    </p>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-start gap-3 py-4">
      <Alert tone="error">{errorMessage(error, t)}</Alert>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-400 px-4 py-8 text-center text-gray-700">
      {children}
    </div>
  );
}

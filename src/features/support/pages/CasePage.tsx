import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { useAuth } from "@/features/auth";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { CaseDetailOut } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useCase, useSetCaseStatus } from "../api";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { HandlerControls } from "../components/HandlerControls";
import { MessageThread } from "../components/MessageThread";
import { ReplyBox } from "../components/ReplyBox";
import { CATEGORY_LABELS } from "../labels";

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

/** What the case is about, linked where this viewer has a page to go to. */
function CaseFacts({ item, isOpener }: { item: CaseDetailOut; isOpener: boolean }) {
  const { t, lang } = useI18n();
  return (
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
      <dt className="text-gray-600">{t("support.case.created")}</dt>
      <dd>
        <time dateTime={item.created_at}>{formatDateTime(item.created_at, lang)}</time>
      </dd>
      {!isOpener && (
        <>
          <dt className="text-gray-600">{t("support.case.from")}</dt>
          <dd className="break-all">{item.opener_email}</dd>
        </>
      )}
      <dt className="text-gray-600">{t("support.case.event")}</dt>
      <dd>
        {item.event_id ? (
          <Link to={`/events/${item.event_id}`} className="underline">
            {item.event_title ?? shortId(item.event_id)}
          </Link>
        ) : (
          t("support.case.platform")
        )}
      </dd>
      {item.order_id && (
        <>
          <dt className="text-gray-600">{t("support.case.order")}</dt>
          <dd className="font-mono">
            {/* The order page is the buyer's own; a handler only gets the reference. */}
            {isOpener ? (
              <Link to={`/orders/${item.order_id}`} className="underline">
                {shortId(item.order_id)}
              </Link>
            ) : (
              shortId(item.order_id)
            )}
          </dd>
        </>
      )}
      {item.ticket_id && (
        <>
          <dt className="text-gray-600">{t("support.case.ticket")}</dt>
          {/* No page of its own: the same short number as printed on the ticket card. */}
          <dd className="font-mono">{shortId(item.ticket_id)}</dd>
        </>
      )}
    </dl>
  );
}

/** /support/cases/:caseId — one case and its messages, checked for news every 10 s. */
export function CasePage() {
  const { caseId = "" } = useParams();
  return <CaseView key={caseId} caseId={caseId} />;
}

function CaseView({ caseId }: { caseId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const justOpened = Boolean((useLocation().state as { justOpened?: boolean } | null)?.justOpened);
  const item = useCase(caseId, { poll: true });
  const setStatus = useSetCaseStatus(caseId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resolvedNow, setResolvedNow] = useState(false);

  if (item.isPending) return <Loading />;
  // No data at all: show why. A failed poll with data already on screen keeps the thread.
  if (!item.data) {
    const status = item.error instanceof ApiError ? item.error.status : 0;
    // 422: the id is not a UUID. Someone else's case is a 404 too, so nothing is revealed.
    return status === 404 || status === 422 ? (
      <EmptyState>
        <p className="mb-2">{t("support.case.notFound")}</p>
        <Link to="/support" className="underline">
          {t("support.case.back")}
        </Link>
      </EmptyState>
    ) : (
      <ErrorState error={item.error} onRetry={() => item.refetch()} />
    );
  }
  if (!user) return null; // the route is wrapped in RequireAuth

  const data = item.data;
  const isOpener = data.opened_by === user.id;
  const resolved = data.status === "resolved";

  async function markResolved() {
    setActionError(null);
    try {
      await setStatus.mutateAsync("resolved");
      setResolvedNow(true);
    } catch (err) {
      setActionError(errorMessage(err, t));
    }
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link to="/support" className="text-sm underline">
        ← {t("support.case.back")}
      </Link>
      {justOpened && <Alert tone="success">{t("support.form.sent")}</Alert>}

      <header className="flex flex-col gap-3">
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold">
          {t(CATEGORY_LABELS[data.category])} <CaseStatusBadge status={data.status} asHandler={!isOpener} />
        </h1>
        <CaseFacts item={data} isOpener={isOpener} />
      </header>

      {isOpener ? (
        !resolved && (
          <Button variant="secondary" onClick={markResolved} disabled={setStatus.isPending} className="self-start">
            {setStatus.isPending ? t("common.loading") : t("support.action.resolve")}
          </Button>
        )
      ) : (
        // Not the opener, yet the API showed the case: so this viewer handles it.
        <HandlerControls item={data} user={user} />
      )}
      {resolvedNow && resolved && <Alert tone="success">{t("support.action.resolved")}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}
      {item.isError && <Alert tone="info">{t("support.case.refreshFailed")}</Alert>}

      <MessageThread item={data} viewerId={user.id} />
      <ReplyBox caseId={caseId} reopensCase={isOpener && resolved} />
    </section>
  );
}

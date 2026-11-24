import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Loading } from "@/components/ui/States";
import { useAuth } from "@/features/auth";
import { useEventsById } from "@/features/events/api";
import { useMyOrders } from "@/features/tickets/api";
import type { SupportKind } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { newCaseDraft, type CaseContext, type CaseDraft } from "../caseInput";
import { CaseForm } from "./CaseForm";

type Subject = { kind: SupportKind; context: CaseContext };

/** How many recent orders the "what is it about" step offers. */
const RECENT_ORDERS = 8;

/**
 * "Новое обращение" on /support (FE-22 #8). A buyer's case is always about an order (the API
 * needs an event, order or ticket), so the first step is picking one; an organizer can also
 * ask the platform. Then the same form as «Помощь».
 */
export function NewCaseButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        + {t("support.new.button")}
      </Button>
      {open && <NewCaseDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function NewCaseDialog({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const orders = useMyOrders();
  const recent = (orders.data ?? []).slice(0, RECENT_ORDERS);
  const events = useEventsById(recent.map((order) => order.event_id));
  const [subject, setSubject] = useState<Subject | null>(null);
  const [draft, setDraft] = useState<CaseDraft | null>(null);

  function pick(next: Subject) {
    setSubject(next);
    setDraft(newCaseDraft(next.kind, next.context));
  }

  const option =
    "flex w-full flex-col items-start gap-0.5 rounded-xl border border-[#E4E1DA] px-3 py-2 text-left text-sm hover:bg-[#F5F4F1] focus-visible:outline focus-visible:outline-2";

  return (
    <Dialog title={t("support.form.title")} onClose={onClose} className="max-w-lg">
      {subject && draft ? (
        <CaseForm
          kind={subject.kind}
          context={subject.context}
          draft={draft}
          onDraftChange={setDraft}
          onSent={() => setDraft(newCaseDraft(subject.kind, subject.context))}
          onCancel={onClose}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{t("support.new.about")}</p>
          {orders.isPending ? (
            <Loading />
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-auto">
              {user?.is_organizer && (
                <li>
                  <button type="button" className={option} onClick={() => pick({ kind: "organizer", context: {} })}>
                    <span className="font-medium">{t("support.helpPlatform")}</span>
                    <span className="text-gray-600">{t("support.new.platformHint")}</span>
                  </button>
                </li>
              )}
              {recent.map((order) => {
                const event = events.get(order.event_id);
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      className={option}
                      onClick={() => pick({ kind: "attendee", context: { order_id: order.id } })}
                    >
                      <span className="font-medium">{event?.title ?? "…"}</span>
                      <span className="text-gray-600">
                        {event && `${formatDateTime(event.start_at, lang)} · `}
                        {t(`order.status.${order.status}`)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!orders.isPending && recent.length === 0 && !user?.is_organizer && (
            <p className="text-sm text-gray-700">
              {t("support.new.noOrders")}{" "}
              <Link to="/events" className="underline" onClick={onClose}>
                {t("myTickets.toEvents")}
              </Link>
            </p>
          )}
          <p className="text-xs text-gray-600">{t("support.new.eventHint")}</p>
        </div>
      )}
    </Dialog>
  );
}

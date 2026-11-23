import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { EmptyState, ErrorState, Loading } from "@/components/ui/States";
import { errorMessage } from "@/lib/api/errors";
import type { StaffOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { useAddStaff, useRemoveStaff, useStaff } from "../api";
import { ReadOnlyNote } from "../components/Stats";

// The same rough shape check as the auth forms; the API validates the address for real.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** «Контролёры»: who may scan tickets at this event's door. */
export function StaffTab({ eventId, readOnly }: { eventId: string; readOnly: boolean }) {
  const { t } = useI18n();
  const staff = useStaff(eventId);
  const add = useAddStaff(eventId);
  const remove = useRemoveStaff(eventId);
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removing, setRemoving] = useState<StaffOut | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setFormError(t("auth.validation.emailInvalid"));
    try {
      const added = await add.mutateAsync(value);
      setEmail("");
      setNotice(t("staff.added").replace("$1", added.email));
    } catch (err) {
      setFormError(errorMessage(err, t));
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setRemoveError(null);
    try {
      await remove.mutateAsync(removing.user_id);
      setNotice(t("staff.removed").replace("$1", removing.email));
      setRemoving(null);
    } catch (err) {
      setRemoveError(errorMessage(err, t));
    }
  }

  return (
    <section aria-labelledby="staff-title" className="flex flex-col gap-4">
      <h2 id="staff-title" className="text-lg font-semibold">{t("staff.title")}</h2>
      <p className="text-sm text-gray-700">{t("staff.intro")}</p>
      {readOnly && <ReadOnlyNote />}
      {notice && <Alert tone="success">{notice}</Alert>}

      {staff.isPending ? (
        <Loading />
      ) : staff.isError ? (
        <ErrorState error={staff.error} onRetry={() => staff.refetch()} />
      ) : staff.data.length === 0 ? (
        <EmptyState>{t("staff.empty")}</EmptyState>
      ) : (
        <ul className="flex flex-col rounded-lg border border-gray-300">
          {staff.data.map((member) => (
            <li
              key={member.user_id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 last:border-0"
            >
              <span className="break-all">{member.email}</span>
              {!readOnly && (
                <Button
                  variant="ghost"
                  className="text-red-800"
                  aria-haspopup="dialog"
                  aria-label={`${t("staff.remove")} ${member.email}`}
                  onClick={() => {
                    setNotice(null);
                    setRemoveError(null);
                    setRemoving(member);
                  }}
                >
                  {t("staff.remove")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <form onSubmit={submit} noValidate className="flex flex-col gap-2 rounded-lg border border-gray-300 p-4">
          <h3 className="font-semibold">{t("staff.addTitle")}</h3>
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <FormField
                label={t("auth.email")}
                hint={t("staff.addHint")}
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={add.isPending} className="sm:mt-6">
              {add.isPending ? t("common.loading") : t("staff.add")}
            </Button>
          </div>
          {formError && <Alert tone="error">{formError}</Alert>}
        </form>
      )}

      {removing && (
        <Dialog title={t("staff.removeTitle")} onClose={() => setRemoving(null)}>
          <p className="text-sm">{t("staff.removeText").replace("$1", removing.email)}</p>
          {removeError && <Alert tone="error">{removeError}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={confirmRemove} disabled={remove.isPending} data-autofocus>
              {remove.isPending ? t("common.loading") : t("staff.remove")}
            </Button>
            <Button variant="ghost" onClick={() => setRemoving(null)} disabled={remove.isPending}>
              {t("orgEvent.orders.keep")}
            </Button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

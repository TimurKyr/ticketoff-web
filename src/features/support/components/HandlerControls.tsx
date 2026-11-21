import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import type { CaseDetailOut, MeOut, SupportStatusUpdate } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { useAssignCase, useSetCaseStatus } from "../api";
import { statusLabel } from "../labels";

type SettableStatus = SupportStatusUpdate["status"];
// "open" is only the starting status: nobody sets it by hand.
const SETTABLE: SettableStatus[] = ["in_progress", "waiting_customer", "resolved"];

/**
 * For whoever handles the case (organizer of the event, or a platform admin): take it,
 * and change its status. The server decides who may; its 403/409 texts are shown as is.
 */
export function HandlerControls({ item, user }: { item: CaseDetailOut; user: MeOut }) {
  const { t } = useI18n();
  const assign = useAssignCase(item.id);
  const setStatus = useSetCaseStatus(item.id);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user.system_role === "platform_admin";
  const mine = item.assignee_id === user.id;
  const someoneElse = item.assignee_id !== null && !mine;
  const busy = assign.isPending || setStatus.isPending;

  async function run(action: () => Promise<unknown>, done: string) {
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <div className="flex flex-wrap items-end gap-3">
        {mine ? (
          <p className="text-sm font-medium">{t("support.action.mine")}</p>
        ) : someoneElse && !isAdmin ? (
          // Only a platform admin can take over; the API answers 409 to anyone else.
          <p className="text-sm font-medium">{t("support.action.takenByOther")}</p>
        ) : (
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => run(() => assign.mutateAsync(), t("support.action.taken"))}
          >
            {t(someoneElse ? "support.action.takeOver" : "support.action.assign")}
          </Button>
        )}
        <div className="w-full sm:w-64">
          <SelectField
            label={t("support.action.status")}
            // An "open" case has no option of its own: it shows as a hidden placeholder.
            value={item.status}
            disabled={busy}
            onChange={(e) =>
              run(() => setStatus.mutateAsync(e.target.value as SettableStatus), t("support.action.statusSaved"))
            }
          >
            {item.status === "open" && (
              <option value="open" disabled hidden>
                {t(statusLabel("open", true))}
              </option>
            )}
            {SETTABLE.map((value) => (
              <option key={value} value={value}>
                {t(statusLabel(value, true))}
              </option>
            ))}
          </SelectField>
        </div>
      </div>
      <p className="text-xs text-gray-600">{t("support.action.replyHint")}</p>
      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}

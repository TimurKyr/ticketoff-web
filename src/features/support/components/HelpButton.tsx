import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useAuth } from "@/features/auth";
import type { SupportKind } from "@/lib/api/types";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { newCaseDraft, type CaseContext } from "../caseInput";
import { CaseForm } from "./CaseForm";

/**
 * "Помощь": opens a new support case about where it is placed (event, order or ticket),
 * or, with kind "organizer", a question from an organizer to the platform.
 * A guest gets a link to /login that comes back here afterwards.
 */
export function HelpButton({
  kind = "attendee",
  context,
  label = "support.help",
  className = "",
}: {
  kind?: SupportKind;
  context?: CaseContext;
  label?: MessageKey;
  className?: string;
}) {
  const { t } = useI18n();
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  // Lives here, not in the form: closing the dialog (Esc, backdrop, "Отмена") keeps the text
  // for the next time it is opened on this page. Cleared once the case is sent.
  const [draft, setDraft] = useState(() => newCaseDraft(kind, context));

  if (isLoading) return null;
  if (!user) {
    return (
      <Link
        to="/login"
        // Same mechanism as the route guards: <GuestOnly> sends the user back to `from`.
        state={{ from: `${location.pathname}${location.search}` }}
        title={t("support.form.loginFirst")}
        className={`self-start text-sm underline ${className}`}
      >
        {t(label)}
      </Link>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`self-start ${className}`}
      >
        {t(label)}
      </Button>
      {open && (
        <Dialog title={t("support.form.title")} onClose={() => setOpen(false)} className="max-w-lg">
          <CaseForm
            kind={kind}
            context={context}
            draft={draft}
            onDraftChange={setDraft}
            onSent={() => setDraft(newCaseDraft(kind, context))}
            onCancel={() => setOpen(false)}
          />
        </Dialog>
      )}
    </>
  );
}

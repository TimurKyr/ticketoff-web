import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import type { SupportCategory, SupportKind } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { useOpenCase } from "../api";
import { validBody, type CaseContext, type CaseDraft } from "../caseInput";
import { CATEGORIES, CATEGORY_LABELS } from "../labels";
import { MessageField } from "./MessageField";

/** New support case (controlled: the caller keeps the draft). On success it opens the case page. */
export function CaseForm({
  kind,
  context = {},
  draft,
  onDraftChange,
  onSent,
  onCancel,
}: {
  kind: SupportKind;
  context?: CaseContext;
  draft: CaseDraft;
  onDraftChange: (draft: CaseDraft) => void;
  /** After the case was created, before going to its page. */
  onSent: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const open = useOpenCase();
  const { category, body } = draft;
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const text = validBody(body);
    if (!text) return setError(t("support.form.bodyRequired"));
    try {
      const created = await open.mutateAsync({ kind, category, body: text, ...context });
      onSent();
      navigate(`/support/cases/${created.id}`, { state: { justOpened: true } });
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <p className="text-sm text-gray-700">
        {t(kind === "organizer" ? "support.form.toPlatform" : "support.form.toOrganizer")}
      </p>
      {error && <Alert tone="error">{error}</Alert>}
      <SelectField
        label={t("support.form.category")}
        value={category}
        onChange={(e) => onDraftChange({ ...draft, category: e.target.value as SupportCategory })}
        data-autofocus
      >
        {CATEGORIES.map((value) => (
          <option key={value} value={value}>
            {t(CATEGORY_LABELS[value])}
          </option>
        ))}
      </SelectField>
      <MessageField
        label={t("support.form.body")}
        required
        rows={6}
        value={body}
        onChange={(value) => onDraftChange({ ...draft, body: value })}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={open.isPending}>
          {open.isPending ? t("common.loading") : t("support.form.submit")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("support.form.cancel")}
        </Button>
      </div>
    </form>
  );
}

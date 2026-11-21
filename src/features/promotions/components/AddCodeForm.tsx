import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

import { useCreateCode } from "../api";

// Same as the API's CODE_PATTERN.
const CODE_RE = /^[A-Za-z0-9_-]{3,32}$/;

/** Add a code to a campaign: a custom one, or leave the field empty and the server makes one. */
export function AddCodeForm({ eventId, campaignId }: { eventId: string; campaignId: string }) {
  const { t } = useI18n();
  const create = useCreateCode(eventId, campaignId);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAdded(null);
    const value = code.trim();
    if (value && !CODE_RE.test(value)) return setError(t("promo.code.customInvalid"));
    try {
      const created = await create.mutateAsync({ code: value || null });
      setCode("");
      setAdded(t("promo.code.added").replace("$1", created.code));
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <FormField
            label={t("promo.code.custom")}
            hint={t("promo.code.customHint")}
            value={code}
            maxLength={32}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            // Shown as it will be stored: the API keeps codes upper-case.
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        {/* mt-6: level with the input (below its label), whatever the hint's length. */}
        <Button type="submit" variant="secondary" disabled={create.isPending} className="sm:mt-6">
          {create.isPending ? t("common.loading") : t("promo.code.create")}
        </Button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {added && <Alert tone="success">{added}</Alert>}
    </form>
  );
}

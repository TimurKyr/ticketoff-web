import { FormEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

import { createOrganizerProfile } from "../api";
import { ResendVerificationButton } from "../components/ResendVerificationButton";
import { useAuth } from "../hooks/useAuth";

export function AccountPage() {
  const { t } = useI18n();
  const { user, refresh, justRegistered } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null; // route is wrapped in RequireAuth

  async function becomeOrganizer(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(t("account.becomeOrganizer.nameRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createOrganizerProfile({ display_name: name.trim() });
      await refresh();
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("account.title")}</h1>
      {justRegistered && !user.email_verified && (
        <Alert tone="success">
          {t("verifyEmail.registered").replace("{email}", user.email)}
        </Alert>
      )}
      {!user.email_verified && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-600 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">{t("account.emailNotVerified")}</h2>
          <p className="text-sm text-amber-900">
            {t("verifyEmail.banner.text").replace("{email}", user.email)}
          </p>
          <ResendVerificationButton />
        </div>
      )}
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-gray-600">{t("auth.email")}</dt>
        <dd className="break-all">
          {user.email}{" "}
          <span className="text-gray-600">
            ({user.email_verified ? t("account.emailVerified") : t("account.emailNotVerified")})
          </span>
        </dd>
        <dt className="text-gray-600">{t("account.role")}</dt>
        <dd>{t(`account.role.${user.system_role}`)}</dd>
        <dt className="text-gray-600">{t("account.organizer")}</dt>
        <dd>{user.is_organizer ? t("account.organizer.yes") : t("account.organizer.no")}</dd>
      </dl>

      {done && <Alert tone="success">{t("account.becomeOrganizer.done")}</Alert>}

      {!user.is_organizer && (
        <form
          onSubmit={becomeOrganizer}
          noValidate
          className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4"
        >
          <h2 className="text-lg font-semibold">{t("account.becomeOrganizer.title")}</h2>
          <p className="text-sm text-gray-700">{t("account.becomeOrganizer.text")}</p>
          {error && <Alert tone="error">{error}</Alert>}
          <FormField
            label={t("account.becomeOrganizer.name")}
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? t("common.loading") : t("account.becomeOrganizer.submit")}
          </Button>
        </form>
      )}
    </section>
  );
}

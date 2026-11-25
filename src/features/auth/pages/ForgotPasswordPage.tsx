import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { requestPasswordReset } from "../api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { t } = useI18n();
  useDocumentTitle(t("auth.forgot.title"));

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = email.trim();
    if (!value) return setEmailError(t("auth.validation.emailRequired"));
    if (!EMAIL_RE.test(value)) return setEmailError(t("auth.validation.emailInvalid"));
    setEmailError(undefined);
    setSubmitting(true);
    try {
      await requestPasswordReset(value);
      setSent(true);
    } catch (err) {
      // Same answer for every account, so too many requests (429) must not reveal anything either.
      if (err instanceof ApiError && err.status === 429) setSent(true);
      else setError(errorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold">{t("auth.forgot.title")}</h1>
      {sent ? (
        <Alert>{t("auth.forgot.sent")}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-gray-700">{t("auth.forgot.text")}</p>
          {error && <Alert tone="error">{error}</Alert>}
          <FormField
            label={t("auth.email")}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? t("common.loading") : t("auth.forgot.submit")}
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-gray-700">
        <Link to="/login" className="font-medium underline">
          {t("auth.forgot.toLogin")}
        </Link>
      </p>
    </section>
  );
}
import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { confirmPasswordReset } from "../api";

/** Bad, used or expired link: the API answers 422 with a plain-text detail. */
function isTokenError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 422 && typeof err.detail === "string";
}

interface FieldErrors {
  password?: MessageKey;
  repeat?: MessageKey;
}

export function ResetPasswordPage() {
  const { t } = useI18n();
  useDocumentTitle(t("auth.reset.title"));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const errors: FieldErrors = {};
    if (password.length < 8) errors.password = "auth.validation.passwordShort";
    if (repeat !== password) errors.repeat = "auth.validation.passwordMismatch";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try {
      await confirmPasswordReset(token, password);
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (err) {
      if (isTokenError(err)) setTokenInvalid(true);
      else setError(errorMessage(err, t));
      setSubmitting(false);
    }
  }

  if (!token || tokenInvalid) {
    return (
      <section className="mx-auto w-full max-w-sm">
        <h1 className="mb-4 text-2xl font-semibold">{t("auth.reset.title")}</h1>
        <Alert tone="error">{t("auth.reset.invalid")}</Alert>
        <p className="mt-4 text-sm text-gray-700">
          <Link to="/forgot-password" className="font-medium underline">
            {t("auth.reset.requestNew")}
          </Link>
        </p>
      </section>
    );
  }

  const fieldError = (key?: MessageKey) => (key ? t(key) : undefined);

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold">{t("auth.reset.title")}</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <FormField
          label={t("auth.reset.password")}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          hint={t("auth.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError(fieldErrors.password)}
        />
        <FormField
          label={t("auth.passwordRepeat")}
          type="password"
          autoComplete="new-password"
          required
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          error={fieldError(fieldErrors.repeat)}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? t("common.loading") : t("auth.reset.submit")}
        </Button>
      </form>
    </section>
  );
}
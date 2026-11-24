import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useAuth } from "../hooks/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: MessageKey;
  password?: MessageKey;
  repeat?: MessageKey;
}

export function RegisterPage() {
  const { t } = useI18n();
  useDocumentTitle(t("auth.register.title"));
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "auth.validation.emailRequired";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "auth.validation.emailInvalid";
    if (password.length < 8) errors.password = "auth.validation.passwordShort";
    if (repeat !== password) errors.repeat = "auth.validation.passwordMismatch";
    return errors;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try {
      // Registers and logs in; <GuestOnly redirectTo="/account"> then redirects.
      await register(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err, t));
      setSubmitting(false);
    }
  }

  const fieldError = (key?: MessageKey) => (key ? t(key) : undefined);

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold">{t("auth.register.title")}</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        <FormField
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError(fieldErrors.email)}
        />
        <FormField
          label={t("auth.password")}
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
          {submitting ? t("common.loading") : t("auth.register.submit")}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-700">
        {t("auth.register.haveAccount")}{" "}
        <Link to="/login" className="font-medium underline">
          {t("auth.register.toLogin")}
        </Link>
      </p>
    </section>
  );
}

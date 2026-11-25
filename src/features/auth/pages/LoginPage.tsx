import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

import { useAuth } from "../hooks/useAuth";

interface LoginState {
  expired?: boolean;
  passwordReset?: boolean;
}

export function LoginPage() {
  const { t } = useI18n();
  useDocumentTitle(t("auth.login.title"));
  const { login } = useAuth();
  const state = (useLocation().state ?? {}) as LoginState;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError(t("auth.login.invalid"));
      return;
    }
    setSubmitting(true);
    try {
      // On success <GuestOnly> redirects (back to `state.from` or home).
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err, t));
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-sm">
      <h1 className="mb-4 text-2xl font-semibold">{t("auth.login.title")}</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {state.passwordReset && !error && <Alert>{t("auth.reset.done")}</Alert>}
        {state.expired && !error && <Alert>{t("auth.sessionExpired")}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <FormField
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Link to="/forgot-password" className="text-sm underline">
          {t("auth.forgot.link")}
        </Link>
        
        <Button type="submit" disabled={submitting}>
          {submitting ? t("common.loading") : t("auth.login.submit")}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-700">
        {t("auth.login.noAccount")}{" "}
        <Link to="/register" className="font-medium underline">
          {t("auth.login.toRegister")}
        </Link>
      </p>
    </section>
  );
}

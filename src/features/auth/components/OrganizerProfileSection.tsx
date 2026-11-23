import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ErrorState, Loading } from "@/components/ui/States";
import { errorMessage } from "@/lib/api/errors";
import type {
  OrganizerProfileOut,
  OrganizerProfileUpdate,
  PayoutAccountStatus,
  VerificationStatus,
} from "@/lib/api/types";
import { useI18n, type MessageKey } from "@/lib/i18n";

import { getOrganizerProfile, organizerProfileKey, updateOrganizerProfile } from "../api";
import { checkEmail, checkPhone, checkWebsite, WEBSITE_MAX, type Checked } from "../contacts";

const NAME_MAX = 100;

const VERIFICATION_LABELS: Record<VerificationStatus, MessageKey> = {
  unverified: "orgProfile.verification.unverified",
  pending: "orgProfile.verification.pending",
  verified: "orgProfile.verification.verified",
};
const PAYOUT_LABELS: Record<PayoutAccountStatus, MessageKey> = {
  pending: "orgProfile.payout.pending",
  verified: "orgProfile.payout.verified",
  rejected: "orgProfile.payout.rejected",
};
const BADGE_TONE: Record<"good" | "wait" | "bad" | "none", string> = {
  good: "bg-green-100 text-green-900",
  wait: "bg-amber-100 text-amber-900",
  bad: "bg-red-100 text-red-900",
  none: "bg-gray-200 text-gray-800",
};

function Badge({ tone, children }: { tone: keyof typeof BADGE_TONE; children: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${BADGE_TONE[tone]}`}>{children}</span>
  );
}

interface Values {
  display_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
}
type ContactField = Exclude<keyof Values, "display_name">;
type Errors = Partial<Record<keyof Values, string>>;

const fromProfile = (p: OrganizerProfileOut): Values => ({
  display_name: p.display_name,
  contact_email: p.contact_email ?? "",
  contact_phone: p.contact_phone ?? "",
  website: p.website ?? "",
});

const CHECKS: Record<ContactField, (input: string) => Checked> = {
  contact_email: checkEmail,
  contact_phone: checkPhone,
  website: checkWebsite,
};

/**
 * The organizer's profile in /account: the name and the public contacts (only the email is
 * shown to buyers, never the phone), and the read-only verification and payout statuses.
 */
export function OrganizerProfileSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: organizerProfileKey, queryFn: getOrganizerProfile });
  const save = useMutation({
    mutationFn: updateOrganizerProfile,
    onSuccess: (updated) => queryClient.setQueryData(organizerProfileKey, updated),
  });
  const [values, setValues] = useState<Values | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // The form starts from the stored profile (and again after a save, with the stored forms).
  useEffect(() => {
    if (profile.data) setValues(fromProfile(profile.data));
  }, [profile.data]);

  if (profile.isPending || !values) return <Loading />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  const current = profile.data;

  const set = (patch: Partial<Values>) => {
    setSaved(false);
    setValues((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!values) return;
    setServerError(null);
    setSaved(false);
    const nextErrors: Errors = {};
    const payload: OrganizerProfileUpdate = {};

    const name = values.display_name.trim();
    if (!name || name.length > NAME_MAX) nextErrors.display_name = t("account.becomeOrganizer.nameRequired");
    else if (name !== current.display_name) payload.display_name = name;

    for (const field of Object.keys(CHECKS) as ContactField[]) {
      const checked = CHECKS[field](values[field]);
      if ("error" in checked) nextErrors[field] = t(checked.error);
      // Only what changed is sent; an emptied field is sent as null (clears it).
      else if (checked.value !== current[field]) payload[field] = checked.value;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (Object.keys(payload).length === 0) {
      // Nothing changed once normalized ("8 701…" is the stored "+7701…"): show the stored forms.
      setValues(fromProfile(current));
      return setSaved(true);
    }
    try {
      // The fields then show what was stored (e.g. "+77011234567"), as the server normalized it.
      setValues(fromProfile(await save.mutateAsync(payload)));
      setSaved(true);
    } catch (err) {
      setServerError(errorMessage(err, t));
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4">
      <h2 className="text-lg font-semibold">{t("orgProfile.title")}</h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          {t("orgProfile.verification")}
          <Badge tone={current.verification_status === "verified" ? "good" : current.verification_status === "pending" ? "wait" : "none"}>
            {t(VERIFICATION_LABELS[current.verification_status])}
          </Badge>
        </span>
        <span className="flex items-center gap-2" data-testid="payout-status">
          {t("orgProfile.payout")}
          {current.payout_status ? (
            <Badge
              tone={current.payout_status === "verified" ? "good" : current.payout_status === "pending" ? "wait" : "bad"}
            >
              {t(PAYOUT_LABELS[current.payout_status])}
            </Badge>
          ) : (
            <Badge tone="none">{t("orgProfile.payout.none")}</Badge>
          )}
        </span>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        {saved && <Alert tone="success">{t("orgProfile.saved")}</Alert>}
        <FormField
          label={t("account.becomeOrganizer.name")}
          required
          maxLength={NAME_MAX}
          value={values.display_name}
          error={errors.display_name}
          onChange={(e) => set({ display_name: e.target.value })}
        />
        <FormField
          label={t("orgProfile.email")}
          hint={t("orgProfile.emailHint")}
          type="email"
          autoComplete="email"
          value={values.contact_email}
          error={errors.contact_email}
          onChange={(e) => set({ contact_email: e.target.value })}
        />
        <FormField
          label={t("orgProfile.phone")}
          hint={t("orgProfile.phoneHint")}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={values.contact_phone}
          error={errors.contact_phone}
          onChange={(e) => set({ contact_phone: e.target.value })}
        />
        <FormField
          label={t("orgProfile.website")}
          hint={t("orgProfile.websiteHint")}
          type="url"
          inputMode="url"
          maxLength={WEBSITE_MAX}
          value={values.website}
          error={errors.website}
          onChange={(e) => set({ website: e.target.value })}
        />
        <Button type="submit" disabled={save.isPending} className="self-start">
          {save.isPending ? t("common.loading") : t("orgProfile.save")}
        </Button>
      </form>
    </section>
  );
}

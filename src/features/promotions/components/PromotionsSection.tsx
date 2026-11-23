import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ErrorState, Loading } from "@/components/ui/States";
import { useTicketTypes } from "@/features/organizer/api";
import type { CampaignOut, TicketTypeOut } from "@/lib/api/types";
import { formatDateTime, formatKzt } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { useCampaigns } from "../api";
import { campaignTypesText } from "../campaignTypes";
import { CampaignForm } from "./CampaignForm";
import { CodesTable } from "./CodesTable";

function CampaignRow({
  eventId,
  campaign,
  tz,
  editable,
  ticketTypes,
}: {
  eventId: string;
  campaign: CampaignOut;
  tz: string;
  editable: boolean;
  ticketTypes: TicketTypeOut[];
}) {
  const { t, lang } = useI18n();
  const discount =
    campaign.discount_type === "percent"
      ? `−${campaign.discount_value}%`
      : `−${formatKzt(campaign.discount_value, lang)}`;
  const limit =
    campaign.max_redemptions != null
      ? `${t("promo.campaign.limit")}: ${campaign.max_redemptions}`
      : t("promo.campaign.unlimited");
  const dates =
    campaign.starts_at || campaign.ends_at
      ? [
          // "с $1" in ru, "$1 бастап" in kk: the word order differs, so the date goes into the text.
          campaign.starts_at &&
            t("promo.campaign.from").replace("$1", formatDateTime(campaign.starts_at, lang, tz)),
          campaign.ends_at &&
            t("promo.campaign.until").replace("$1", formatDateTime(campaign.ends_at, lang, tz)),
        ]
          .filter(Boolean)
          .join(" ")
      : t("promo.campaign.noDates");

  return (
    <li className="flex flex-col gap-3 border-b border-gray-200 py-3 last:border-0">
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">
          {campaign.name}{" "}
          <span className="ml-1 rounded bg-gray-200 px-1.5 py-0.5 text-sm font-semibold">{discount}</span>
        </h3>
        <p className="text-sm text-gray-700">
          {limit} · {dates}
        </p>
        <p className="text-sm text-gray-700">
          {t("promo.campaign.appliesTo")}:{" "}
          {campaignTypesText(campaign, ticketTypes, t("promo.campaign.allTypes"))}
        </p>
      </div>
      <CodesTable eventId={eventId} campaignId={campaign.id} editable={editable} />
    </li>
  );
}

/** Promo campaigns of one event. Campaigns cannot be edited or deleted (no API for it). */
export function PromotionsSection({
  eventId,
  tz,
  editable,
}: {
  eventId: string;
  tz: string;
  /** False for cancelled/completed events: the API refuses new campaigns there. */
  editable: boolean;
}) {
  const { t } = useI18n();
  const campaigns = useCampaigns(eventId);
  const ticketTypes = useTicketTypes(eventId);
  const types = ticketTypes.data ?? [];
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <h2 className="text-xl font-semibold">{t("promo.title")}</h2>
      {!editable && <p className="text-sm text-gray-700">{t("promo.closed")}</p>}
      {notice && <Alert tone="success">{notice}</Alert>}
      {campaigns.isPending ? (
        <Loading />
      ) : campaigns.isError ? (
        <ErrorState error={campaigns.error} onRetry={() => campaigns.refetch()} />
      ) : (
        <>
          {campaigns.data.length === 0 && <p className="text-gray-700">{t("promo.empty")}</p>}
          <ul className="flex flex-col">
            {campaigns.data.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                eventId={eventId}
                campaign={campaign}
                tz={tz}
                editable={editable}
                ticketTypes={types}
              />
            ))}
          </ul>
          {editable &&
            (adding ? (
              <CampaignForm
                eventId={eventId}
                tz={tz}
                ticketTypes={types}
                onDone={(created) => {
                  setAdding(false);
                  if (created) setNotice(t("promo.campaign.created"));
                }}
              />
            ) : (
              <Button
                variant="secondary"
                className="self-start"
                onClick={() => {
                  setNotice(null);
                  setAdding(true);
                }}
              >
                + {t("promo.campaign.add")}
              </Button>
            ))}
        </>
      )}
    </section>
  );
}

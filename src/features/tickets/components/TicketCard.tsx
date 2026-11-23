import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { HelpButton } from "@/features/support";
import type { TicketOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { downloadTicketPdf } from "../api";
import { TicketQr } from "./TicketQr";

export function TicketCard({
  ticket,
  ticketTypeName,
}: {
  ticket: TicketOut;
  ticketTypeName?: string;
}) {
  const { t } = useI18n();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  async function onPdf() {
    setError(false);
    setDownloading(true);
    try {
      await downloadTicketPdf(ticket.id);
    } catch {
      setError(true);
    } finally {
      setDownloading(false);
    }
  }

  const usable = ticket.status === "valid";

  return (
    <li className="flex flex-col items-center gap-3 rounded-lg border border-gray-300 bg-white p-4 sm:flex-row sm:items-start">
      {usable ? (
        <TicketQr token={ticket.qr_token} alt={`${t("ticket.qrAlt")}: ${ticket.attendee.name}`} />
      ) : null}
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-lg font-semibold">{ticket.attendee.name}</p>
        {ticketTypeName && <p className="text-sm text-gray-700">{ticketTypeName}</p>}
        <p className="text-sm">
          {t("order.status")}: <strong>{t(`ticket.status.${ticket.status}`)}</strong>
        </p>
        <p className="font-mono text-xs text-gray-600">
          {t("ticket.title")} {ticket.id.slice(0, 8).toUpperCase()}
        </p>
        {usable && (
          <Button variant="secondary" onClick={onPdf} disabled={downloading} className="mt-2 self-start">
            {downloading ? t("common.loading") : t("ticket.pdf")}
          </Button>
        )}
        {error && <Alert tone="error">{t("ticket.pdfError")}</Alert>}
        <HelpButton context={{ ticket_id: ticket.id }} className="mt-1" />
      </div>
    </li>
  );
}

import { useEffect, useId, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState, Loading } from "@/components/ui/States";
import type { CodeOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { promoLink, useCodeQrPng } from "../api";

/** Object URL for a Blob, revoked when the blob changes or the component unmounts. */
function useObjectUrl(blob: Blob | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return setUrl(null);
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

/**
 * QR of one promo code: the PNG from the API, a download link and the link to copy.
 * Mounted only while open (see Dialog for focus and Esc).
 */
export function PromoQrDialog({
  eventId,
  code,
  onClose,
}: {
  eventId: string;
  code: CodeOut;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const linkId = useId();
  const linkRef = useRef<HTMLInputElement>(null);
  const png = useCodeQrPng(eventId, code.campaign_id, code.id, true);
  const src = useObjectUrl(png.data);
  const link = promoLink(eventId, code.qr_token);
  const [copy, setCopy] = useState<"copied" | "failed" | null>(null);

  // The "copied" note goes away after a moment; a failure stays until the next try.
  useEffect(() => {
    if (copy !== "copied") return;
    const timer = window.setTimeout(() => setCopy(null), 2500);
    return () => window.clearTimeout(timer);
  }, [copy]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopy("copied");
    } catch {
      // Clipboard blocked (permissions, insecure origin): select the text for Ctrl+C instead.
      setCopy("failed");
      linkRef.current?.focus();
      linkRef.current?.select();
    }
  }

  return (
    <Dialog
      onClose={onClose}
      title={
        <>
          {t("promo.code.qrTitle")} <span className="font-mono">{code.code}</span>
        </>
      }
    >
      <div className="flex justify-center">
        {png.isPending ? (
          <div className="flex h-60 w-60 items-center justify-center bg-gray-100">
            <Loading />
          </div>
        ) : png.isError ? (
          <ErrorState error={png.error} onRetry={() => png.refetch()} />
        ) : (
          src && (
            <img
              src={src}
              alt={`${t("promo.code.qrAlt")} ${code.code}`}
              width={240}
              height={240}
              className="h-60 w-60 bg-white"
            />
          )
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={linkId} className="text-sm font-medium">
          {t("promo.code.link")}
        </label>
        <input
          id={linkId}
          ref={linkRef}
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          className="rounded-md border border-gray-400 bg-gray-50 px-3 py-2 font-mono text-xs"
        />
        <p role="status" className="min-h-5 text-sm">
          {copy === "copied" && <span className="text-green-800">{t("promo.code.copied")}</span>}
        </p>
        {copy === "failed" && <Alert tone="error">{t("promo.code.copyFailed")}</Alert>}
      </div>

      <div className="flex flex-wrap gap-2">
        {src ? (
          <a
            href={src}
            download={`promo-${code.code}.png`}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {t("promo.code.qrDownload")}
          </a>
        ) : null}
        {/* Focus starts here: the main action, not the first focusable thing (the link field). */}
        <Button data-autofocus variant="secondary" onClick={onCopy}>
          {t("promo.code.copyLink")}
        </Button>
        <Button variant="ghost" onClick={onClose} className="ml-auto">
          {t("promo.code.qrClose")}
        </Button>
      </div>
    </Dialog>
  );
}

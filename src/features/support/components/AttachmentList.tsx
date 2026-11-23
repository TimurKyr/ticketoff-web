import { useEffect, useState } from "react";

import type { AttachmentOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { downloadAttachment, fetchAttachment } from "../api";
import { formatFileSize, isImageType } from "../attachments";

/**
 * The files of one message: a preview for images, a name with a download button for all.
 * A file needs the login token, so it is fetched with apiClient and shown or saved from the
 * blob; a plain <img src> or <a href> would be refused.
 */
export function AttachmentList({ attachments }: { attachments: AttachmentOut[] }) {
  const { t } = useI18n();
  if (attachments.length === 0) return null;
  return (
    <ul aria-label={t("support.attach.list")} className="flex flex-col gap-2">
      {attachments.map((attachment) => (
        <AttachmentItem key={attachment.id} attachment={attachment} />
      ))}
    </ul>
  );
}

function AttachmentItem({ attachment }: { attachment: AttachmentOut }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await downloadAttachment(attachment);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-1 rounded-md border border-gray-300 bg-white p-2 text-gray-900">
      {isImageType(attachment.content_type) && <ImagePreview attachment={attachment} />}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium [overflow-wrap:anywhere]">{attachment.filename}</span>
        <span className="text-xs text-gray-600">{formatFileSize(attachment.size, lang)}</span>
        <button
          type="button"
          onClick={() => void download()}
          disabled={busy}
          aria-label={t("support.attach.download").replace("$1", attachment.filename)}
          className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-black hover:bg-gray-200 disabled:opacity-50"
        >
          {busy ? t("support.attach.downloading") : "↓"}
        </button>
      </div>
      {failed && (
        <p role="alert" className="text-xs text-red-700">
          {t("support.attach.failed")}
        </p>
      )}
    </li>
  );
}

/** Loads the image when it appears and frees it when it goes. A failed load shows nothing. */
function ImagePreview({ attachment }: { attachment: AttachmentOut }) {
  const { t } = useI18n();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    fetchAttachment(attachment)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        // The download button still works and shows its own error.
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment]);

  if (!src) return <div className="h-24 w-40 animate-pulse rounded bg-gray-100" aria-hidden="true" />;
  return (
    <img
      src={src}
      alt={t("support.attach.preview").replace("$1", attachment.filename)}
      className="max-h-48 max-w-full rounded object-contain"
    />
  );
}

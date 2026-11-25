import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { EventCover } from "@/features/events/components/EventCover";
import type { EventOut } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n";

import { useEventImage } from "../api";
import { checkCoverFile, COVER_ACCEPT, coverErrorKey } from "./coverFile";
import { useAuthedImage } from "./useAuthedImage";

/** «Обложка» in the organizer's event editor (R-12): preview, upload / replace, remove. */
export function CoverSection({ event, editable }: { event: EventOut; editable: boolean }) {
  const { t } = useI18n();
  const { upload, remove } = useEventImage(event.id);
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  // The file just uploaded, shown at once (and while the event's own URL loads).
  const [local, setLocal] = useState<string | null>(null);
  const authed = useAuthedImage(local ? null : event.image_url);

  useEffect(() => () => {
    if (local) URL.revokeObjectURL(local);
  }, [local]);

  const pending = upload.isPending || remove.isPending;
  const src = local ?? authed.src ?? (authed.failed ? event.image_url ?? null : null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setError(null);
    const problem = checkCoverFile(file);
    if (problem) {
      setError(t(problem));
      return;
    }
    try {
      await upload.mutateAsync(file);
      setLocal(URL.createObjectURL(file));
    } catch (err) {
      setError(t(coverErrorKey(err)));
    }
  }

  async function drop() {
    setError(null);
    try {
      await remove.mutateAsync();
      setLocal(null);
    } catch (err) {
      setError(t(coverErrorKey(err)));
    }
  }

  const hasImage = Boolean(local || event.image_url);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <h2 className="text-xl font-semibold">{t("org.cover.title")}</h2>
      <div className="max-w-md">
        {src ? (
          <img src={src} alt={t("org.cover.alt")} className="aspect-video w-full rounded-xl object-cover" />
        ) : (
          <EventCover event={{ ...event, image_url: null }} />
        )}
      </div>
      <p className="text-xs text-gray-600">{t(hasImage ? "org.cover.hint" : "org.cover.generated")}</p>
      {editable && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept={COVER_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              void choose(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" disabled={pending} onClick={() => input.current?.click()}>
            <ImagePlus className="mr-1 inline h-4 w-4" aria-hidden />
            {upload.isPending ? t("org.cover.uploading") : t(hasImage ? "org.cover.replace" : "org.cover.upload")}
          </Button>
          {hasImage && (
            <Button type="button" variant="ghost" disabled={pending} onClick={() => void drop()}>
              <Trash2 className="mr-1 inline h-4 w-4" aria-hidden />
              {t("org.cover.remove")}
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

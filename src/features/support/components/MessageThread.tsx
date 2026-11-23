import { useEffect, useRef } from "react";

import type { CaseDetailOut } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

import { AttachmentList } from "./AttachmentList";

/**
 * Messages oldest → newest. Mine are on the right ("Вы"); the customer's are signed with
 * their email when a handler reads; anyone else on the handling side is "Поддержка".
 * Text is rendered as text (React escapes it), with its line breaks kept.
 */
export function MessageThread({ item, viewerId }: { item: CaseDetailOut; viewerId: string }) {
  const { t, lang } = useI18n();
  const lastRef = useRef<HTMLLIElement>(null);
  const lastId = item.messages[item.messages.length - 1]?.id;
  const shownLastId = useRef<string | undefined>(undefined);

  // Scroll to the newest message on first load and whenever a newer one appears (mine
  // after sending, or a reply found by polling). A poll that brings nothing new keeps
  // the scroll where the reader left it.
  useEffect(() => {
    if (!lastId || lastId === shownLastId.current) return;
    shownLastId.current = lastId;
    lastRef.current?.scrollIntoView({ block: "nearest" });
  }, [lastId]);

  function author(senderId: string): string {
    if (senderId === viewerId) return t("support.thread.you");
    if (senderId === item.opened_by) return item.opener_email;
    return t("support.thread.support");
  }

  return (
    // role="log": new messages are read out politely by screen readers as they arrive.
    <div role="log" aria-label={t("support.thread.title")}>
      <ol className="flex flex-col gap-3">
        {item.messages.map((message, index) => {
          const mine = message.sender_id === viewerId;
          return (
            <li
              key={message.id}
              ref={index === item.messages.length - 1 ? lastRef : undefined}
              className={`flex max-w-[85%] flex-col gap-1 ${mine ? "items-end self-end" : "items-start self-start"}`}
            >
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-800">{author(message.sender_id)}</span>
                {" · "}
                <time dateTime={message.created_at}>{formatDateTime(message.created_at, lang)}</time>
              </p>
              <p
                className={`whitespace-pre-wrap rounded-lg px-3 py-2 [overflow-wrap:anywhere] ${
                  mine ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.body}
              </p>
              <AttachmentList attachments={message.attachments ?? []} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

import { FormEvent, KeyboardEvent, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

import { useReply } from "../api";
import { validBody } from "../caseInput";
import { MessageField } from "./MessageField";

/** Reply in a case. Ctrl/⌘+Enter sends. The text stays if sending fails. */
export function ReplyBox({ caseId, reopensCase }: { caseId: string; reopensCase: boolean }) {
  const { t } = useI18n();
  const reply = useReply(caseId);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function send() {
    if (reply.isPending) return;
    setError(null);
    const body = validBody(text);
    if (!body) return setError(t("support.reply.required"));
    try {
      await reply.mutateAsync(body);
      setText("");
      // The send button was disabled while sending, which drops its focus: go back to the
      // field, ready for the next message.
      formRef.current?.querySelector("textarea")?.focus();
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void send();
      }}
      noValidate
      className="flex flex-col gap-2 border-t border-gray-300 pt-4"
    >
      {reopensCase && <p className="text-sm text-gray-700">{t("support.reply.reopens")}</p>}
      {error && <Alert tone="error">{error}</Alert>}
      <MessageField
        label={t("support.reply.label")}
        value={text}
        onChange={setText}
        onKeyDown={onKeyDown}
        // readOnly, not disabled, while sending: a disabled field would drop the focus.
        readOnly={reply.isPending}
        aria-busy={reply.isPending}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={reply.isPending}>
          {reply.isPending ? t("common.loading") : t("support.reply.send")}
        </Button>
        <span className="text-xs text-gray-600">{t("support.reply.hint")}</span>
      </div>
    </form>
  );
}

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";

import { useReply } from "../api";
import { MAX_FILES, addFiles, formatFileSize, type AttachmentProblem } from "../attachments";
import { validBody } from "../caseInput";
import { MessageField } from "./MessageField";

/**
 * Reply in a case, with up to 3 files. Ctrl/⌘+Enter sends. The text and the files stay if
 * sending fails.
 */
export function ReplyBox({ caseId, reopensCase }: { caseId: string; reopensCase: boolean }) {
  const { t, lang } = useI18n();
  const reply = useReply(caseId);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function send() {
    if (reply.isPending) return;
    setError(null);
    const body = validBody(text);
    if (!body) return setError(t("support.reply.required"));
    try {
      await reply.mutateAsync({ body, files });
      setText("");
      setFiles([]);
      // The send button was disabled while sending, which drops its focus: go back to the
      // field, ready for the next message.
      formRef.current?.querySelector("textarea")?.focus();
    } catch (err) {
      setError(errorMessage(err, t));
    }
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // so picking the same file again after removing it still fires
    if (picked.length === 0) return;
    const result = addFiles(files, picked);
    setFiles(result.files);
    setError(result.problem ? problemText(result.problem) : null);
  }

  function problemText(problem: AttachmentProblem): string {
    return t(`support.attach.${problem}`);
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
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf"
        onChange={onPick}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 text-sm"
            >
              <span className="[overflow-wrap:anywhere]">{file.name}</span>
              <span className="text-xs text-gray-600">{formatFileSize(file.size, lang)}</span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                disabled={reply.isPending}
                aria-label={t("support.attach.remove").replace("$1", file.name)}
                className="ml-auto px-1 text-gray-700 hover:text-black disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={reply.isPending}>
          {reply.isPending ? t("common.loading") : t("support.reply.send")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={reply.isPending || files.length >= MAX_FILES}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("support.attach.button")}
        </Button>
        <span className="text-xs text-gray-600">{t("support.reply.hint")}</span>
      </div>
      <p className="text-xs text-gray-600">{t("support.attach.hint")}</p>
    </form>
  );
}

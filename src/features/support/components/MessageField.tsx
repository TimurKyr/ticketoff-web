import { TextareaHTMLAttributes, useId } from "react";

import { TextAreaField } from "@/components/ui/FormField";
import { useI18n } from "@/lib/i18n";

import { BODY_MAX } from "../caseInput";

interface MessageFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Message textarea with a "Символов: N из 5000" counter tied to it for screen readers. */
export function MessageField({ label, value, onChange, ...props }: MessageFieldProps) {
  const { t } = useI18n();
  const counterId = useId();
  const length = value.trim().length;
  return (
    <div className="flex flex-col gap-1">
      <TextAreaField
        label={label}
        maxLength={BODY_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={counterId}
        {...props}
      />
      <p id={counterId} className={`text-right text-xs ${length > BODY_MAX ? "text-red-700" : "text-gray-600"}`}>
        {t("support.form.counter").replace("$1", String(length)).replace("$2", String(BODY_MAX))}
      </p>
    </div>
  );
}

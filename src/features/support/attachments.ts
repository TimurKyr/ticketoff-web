import { formatDecimal } from "@/lib/format";
import type { Language } from "@/lib/i18n";

/** The API's limits for the files of one message (BE-33). */
export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const TYPE_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
};
const ALLOWED_TYPES = new Set(Object.values(TYPE_BY_EXTENSION));

export type AttachmentProblem = "tooMany" | "tooBig" | "type" | "empty";

/** What the browser says the file is; falls back to the extension when it says nothing. */
function declaredType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXTENSION[extension] ?? "";
}

/**
 * Adds the picked files to the ones already chosen, within the API's limits. The check here
 * only saves a round trip: the API looks inside the file and has the last word.
 * Files that are not allowed are left out and the first problem is reported.
 */
export function addFiles(
  current: File[],
  picked: File[]
): { files: File[]; problem: AttachmentProblem | null } {
  const files = [...current];
  let problem: AttachmentProblem | null = null;
  for (const file of picked) {
    if (files.length >= MAX_FILES) {
      problem ??= "tooMany";
    } else if (file.size === 0) {
      problem ??= "empty";
    } else if (file.size > MAX_FILE_BYTES) {
      problem ??= "tooBig";
    } else if (!ALLOWED_TYPES.has(declaredType(file))) {
      problem ??= "type";
    } else {
      files.push(file);
    }
  }
  return { files, problem };
}

/** "850 Б", "12 КБ", "4,2 МБ" (the same in ru and kk), "4.2 MB" in en: one decimal below 10. */
export function formatFileSize(bytes: number, lang?: Language): string {
  const units = lang === "en" ? ["B", "KB", "MB"] : ["Б", "КБ", "МБ"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const text = unit === 0 || value >= 10 ? String(Math.round(value)) : formatDecimal(value, lang ?? "ru");
  return `${text}\u00a0${units[unit]}`;
}

export const isImageType = (contentType: string): boolean => contentType.startsWith("image/");

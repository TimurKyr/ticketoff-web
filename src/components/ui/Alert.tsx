import { ReactNode } from "react";

type AlertTone = "error" | "success" | "info";

const toneClasses: Record<AlertTone, string> = {
  error: "border-red-700 bg-red-50 text-red-800",
  success: "border-green-700 bg-green-50 text-green-800",
  info: "border-gray-400 bg-gray-50 text-gray-800",
};

export function Alert({ tone = "info", children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border-l-4 px-3 py-2 text-sm ${toneClasses[tone]}`}
    >
      {children}
    </div>
  );
}

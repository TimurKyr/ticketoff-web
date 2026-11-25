import { describe, expect, it } from "vitest";

import { filenameFromDisposition, reportPath } from "./download";

describe("filenameFromDisposition", () => {
  it("reads a quoted filename", () => {
    expect(
      filenameFromDisposition('attachment; filename="ticketoff-orders-2026-11-01_2026-11-30.csv"', "x.csv")
    ).toBe("ticketoff-orders-2026-11-01_2026-11-30.csv");
  });

  it("reads an unquoted filename", () => {
    expect(filenameFromDisposition("attachment; filename=report.csv", "x.csv")).toBe("report.csv");
  });

  it("prefers filename* (RFC 5987)", () => {
    expect(
      filenameFromDisposition(
        "attachment; filename=\"fallback.csv\"; filename*=UTF-8''%D0%BE%D1%82%D1%87%D1%91%D1%82.csv",
        "x.csv"
      )
    ).toBe("отчёт.csv");
  });

  it("drops path parts", () => {
    expect(filenameFromDisposition('attachment; filename="../../etc/passwd"', "x.csv")).toBe("passwd");
  });

  it("falls back without a name", () => {
    expect(filenameFromDisposition(null, "x.csv")).toBe("x.csv");
    expect(filenameFromDisposition("attachment", "x.csv")).toBe("x.csv");
    expect(filenameFromDisposition('attachment; filename=""', "x.csv")).toBe("x.csv");
  });
});

describe("reportPath", () => {
  it("adds only the days given", () => {
    expect(reportPath("payments", "", "")).toBe("/admin/reports/payments.csv");
    expect(reportPath("orders", "2026-11-01", "")).toBe("/admin/reports/orders.csv?from_date=2026-11-01");
    expect(reportPath("refunds", "2026-11-01", "2026-11-30")).toBe(
      "/admin/reports/refunds.csv?from_date=2026-11-01&to_date=2026-11-30"
    );
  });
});

import { describe, expect, it } from "vitest";

import { MAX_FILE_BYTES, MAX_FILES, addFiles, formatFileSize, isImageType } from "./attachments";

const file = (name: string, size = 100, type = "") => {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

describe("addFiles", () => {
  it("takes PNG, JPEG and PDF files", () => {
    const picked = [file("a.png", 10, "image/png"), file("b.jpg", 10, "image/jpeg"), file("c.pdf", 10, "application/pdf")];
    expect(addFiles([], picked)).toEqual({ files: picked, problem: null });
  });

  it("goes by the extension when the browser gives no type", () => {
    expect(addFiles([], [file("scan.PDF")]).problem).toBeNull();
    expect(addFiles([], [file("scan.jpeg")]).files).toHaveLength(1);
  });

  it("leaves out other types", () => {
    for (const name of ["a.exe", "a.gif", "a.svg", "a.txt", "noextension"]) {
      expect(addFiles([], [file(name)])).toEqual({ files: [], problem: "type" });
    }
    expect(addFiles([], [file("a.png", 10, "application/x-msdownload")]).problem).toBe("type");
  });

  it("allows exactly 5 MB and refuses more", () => {
    expect(addFiles([], [file("a.png", MAX_FILE_BYTES, "image/png")]).problem).toBeNull();
    expect(addFiles([], [file("a.png", MAX_FILE_BYTES + 1, "image/png")])).toEqual({ files: [], problem: "tooBig" });
  });

  it("refuses an empty file", () => {
    expect(addFiles([], [file("a.png", 0, "image/png")])).toEqual({ files: [], problem: "empty" });
  });

  it("keeps at most 3 files in total", () => {
    const have = [file("1.png", 1, "image/png"), file("2.png", 1, "image/png")];
    const result = addFiles(have, [file("3.png", 1, "image/png"), file("4.png", 1, "image/png")]);
    expect(result.files).toHaveLength(MAX_FILES);
    expect(result.problem).toBe("tooMany");
  });

  it("keeps the good files and reports the first problem", () => {
    const good = file("ok.png", 1, "image/png");
    const result = addFiles([], [file("bad.exe"), good, file("big.png", MAX_FILE_BYTES + 1, "image/png")]);
    expect(result).toEqual({ files: [good], problem: "type" });
  });

  it("does not change the list it was given", () => {
    const have: File[] = [];
    addFiles(have, [file("a.png", 1, "image/png")]);
    expect(have).toEqual([]);
  });
});

describe("formatFileSize", () => {
  it("picks a unit and rounds", () => {
    expect(formatFileSize(850, "ru")).toBe("850 Б");
    expect(formatFileSize(1536, "ru")).toBe("1,5 КБ");
    expect(formatFileSize(12 * 1024, "ru")).toBe("12 КБ");
    expect(formatFileSize(5 * 1024 * 1024, "kk")).toBe("5,0 МБ");
  });
});

describe("isImageType", () => {
  it("is true for images only", () => {
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("application/pdf")).toBe(false);
  });
});

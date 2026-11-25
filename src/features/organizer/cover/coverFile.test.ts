import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";

import { checkCoverFile, COVER_MAX_BYTES, coverErrorKey } from "./coverFile";

describe("checkCoverFile", () => {
  it("takes PNG, JPEG and WebP up to 5 MB", () => {
    expect(checkCoverFile({ type: "image/png", size: 1000 })).toBeNull();
    expect(checkCoverFile({ type: "image/jpeg", size: COVER_MAX_BYTES })).toBeNull();
    expect(checkCoverFile({ type: "image/webp", size: 1 })).toBeNull();
  });

  it("refuses other types, empty and too big files", () => {
    expect(checkCoverFile({ type: "image/gif", size: 1000 })).toBe("org.cover.err.type");
    expect(checkCoverFile({ type: "", size: 1000 })).toBe("org.cover.err.type");
    expect(checkCoverFile({ type: "image/png", size: 0 })).toBe("org.cover.err.empty");
    expect(checkCoverFile({ type: "image/png", size: COVER_MAX_BYTES + 1 })).toBe("org.cover.err.size");
  });
});

describe("coverErrorKey", () => {
  it("translates by status", () => {
    expect(coverErrorKey(new ApiError(413, null))).toBe("org.cover.err.size");
    expect(coverErrorKey(new ApiError(422, { detail: "Unsupported image" }))).toBe("org.cover.err.type");
    expect(coverErrorKey(new ApiError(409, null))).toBe("org.cover.err.closed");
    expect(coverErrorKey(new ApiError(404, null))).toBe("org.cover.err.notFound");
    expect(coverErrorKey(new ApiError(500, null))).toBe("common.error");
    expect(coverErrorKey(new TypeError("fetch failed"))).toBe("common.networkError");
  });
});

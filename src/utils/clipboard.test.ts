import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./clipboard.js";

// Mock clipboardy module
vi.mock("clipboardy", () => ({
  default: {
    write: vi.fn(),
  },
}));

describe("copyToClipboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully copy text to clipboard", async () => {
    const clipboardy = await import("clipboardy");
    vi.mocked(clipboardy.default.write).mockResolvedValue(undefined);

    await copyToClipboard("test text");

    expect(clipboardy.default.write).toHaveBeenCalledWith("test text");
  });

  it("should throw error with specific message when clipboardy throws Error", async () => {
    const clipboardy = await import("clipboardy");
    const originalError = new Error("Clipboard access denied");
    vi.mocked(clipboardy.default.write).mockRejectedValue(originalError);

    await expect(copyToClipboard("test text")).rejects.toThrow(
      "Failed to copy to clipboard: Clipboard access denied",
    );
  });

  it("should throw generic error when clipboardy throws non-Error", async () => {
    const clipboardy = await import("clipboardy");
    vi.mocked(clipboardy.default.write).mockRejectedValue("unknown error");

    await expect(copyToClipboard("test text")).rejects.toThrow("Failed to copy to clipboard");
  });

  it("should handle empty string", async () => {
    const clipboardy = await import("clipboardy");
    vi.mocked(clipboardy.default.write).mockResolvedValue(undefined);

    await copyToClipboard("");

    expect(clipboardy.default.write).toHaveBeenCalledWith("");
  });

  it("should handle multiline text", async () => {
    const clipboardy = await import("clipboardy");
    vi.mocked(clipboardy.default.write).mockResolvedValue(undefined);

    const multilineText = "Line 1\nLine 2\nLine 3";
    await copyToClipboard(multilineText);

    expect(clipboardy.default.write).toHaveBeenCalledWith(multilineText);
  });
});

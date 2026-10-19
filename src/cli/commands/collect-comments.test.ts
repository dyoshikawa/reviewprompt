import { afterEach, describe, expect, it, vi } from "vitest";

import type { GitHubClient } from "../../lib/github.js";
import type { PRComment } from "../../lib/types.js";
import { collectMentionedComments, noCommentsMessage } from "./collect-comments.js";

const prInfo = { owner: "o", repo: "r", pullNumber: 1 };

function comment(
  id: number,
  login: string,
  authorAssociation: string,
  body = "[ai] fix",
): PRComment {
  return {
    id,
    body,
    user: { login },
    authorAssociation,
    htmlUrl: "",
    position: null,
    originalPosition: null,
    createdAt: "",
    updatedAt: "",
  };
}

function mockClient(comments: PRComment[], viewerLogin?: string) {
  return {
    getReviewComments: vi.fn().mockResolvedValue(comments),
    getViewerLogin: vi.fn().mockResolvedValue(viewerLogin),
  } as unknown as GitHubClient & {
    getViewerLogin: ReturnType<typeof vi.fn>;
  };
}

describe("collectMentionedComments", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("drops comments from untrusted authors by default and reports them", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = mockClient(
      [
        comment(1, "owner", "OWNER"),
        comment(2, "stranger", "NONE"),
        comment(3, "me", "CONTRIBUTOR"),
        comment(4, "owner", "OWNER", "no mention"),
      ],
      "me",
    );

    const result = await collectMentionedComments(client, prInfo, "[ai]", {});

    expect(result.comments.map((c) => c.id)).toEqual([1, 3]);
    expect(result.skippedCount).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Skipped 1 comment(s)"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("@stranger"));
  });

  it("keeps every mentioned comment with includeUntrustedAuthors", async () => {
    const client = mockClient([comment(1, "owner", "OWNER"), comment(2, "stranger", "NONE")]);

    const result = await collectMentionedComments(client, prInfo, "[ai]", {
      includeUntrustedAuthors: true,
    });

    expect(result.comments.map((c) => c.id)).toEqual([1, 2]);
    expect(result.skippedCount).toBe(0);
    expect(client.getViewerLogin).not.toHaveBeenCalled();
  });

  it("drops the viewer's own CONTRIBUTOR comment when the viewer login is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const client = mockClient([comment(1, "me", "CONTRIBUTOR")], undefined);

    const result = await collectMentionedComments(client, prInfo, "[ai]", {});

    expect(result.comments).toEqual([]);
    expect(result.skippedCount).toBe(1);
  });

  it("does not look up the viewer when no comment carries the mention", async () => {
    const client = mockClient([comment(1, "owner", "OWNER", "no mention")], "me");

    const result = await collectMentionedComments(client, prInfo, "[ai]", {});

    expect(result).toEqual({ comments: [], skippedCount: 0 });
    expect(client.getViewerLogin).not.toHaveBeenCalled();
  });

  it("lists each untrusted author once", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = mockClient([comment(1, "stranger", "NONE"), comment(2, "stranger", "NONE")]);

    await collectMentionedComments(client, prInfo, "[ai]", {});

    const message = String(errorSpy.mock.calls[0]?.[0]);
    expect(message).toContain("Skipped 2 comment(s)");
    expect(message.match(/@stranger/g)).toHaveLength(1);
  });
});

describe("noCommentsMessage", () => {
  it("mentions skipped comments when some were dropped", () => {
    expect(noCommentsMessage("[ai]", 2)).toBe(
      'No trusted comments found with mention "[ai]" (2 skipped)',
    );
  });

  it("keeps the plain message when nothing was skipped", () => {
    expect(noCommentsMessage("[ai]", 0)).toBe('No comments found with mention "[ai]"');
  });
});

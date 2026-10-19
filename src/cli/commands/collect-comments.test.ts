import { afterEach, describe, expect, it, vi } from "vitest";

import type { GitHubClient } from "../../lib/github.js";
import type { PRComment } from "../../lib/types.js";
import { collectMentionedComments } from "./collect-comments.js";

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

    expect(result.map((c) => c.id)).toEqual([1, 3]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Skipped 1 comment(s)"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("@stranger"));
  });

  it("keeps every mentioned comment with includeUntrustedAuthors", async () => {
    const client = mockClient([comment(1, "owner", "OWNER"), comment(2, "stranger", "NONE")]);

    const result = await collectMentionedComments(client, prInfo, "[ai]", {
      includeUntrustedAuthors: true,
    });

    expect(result.map((c) => c.id)).toEqual([1, 2]);
    expect(client.getViewerLogin).not.toHaveBeenCalled();
  });
});

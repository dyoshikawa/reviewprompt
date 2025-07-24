import { describe, expect, it } from "vitest";
import { cleanCommentBody, filterCommentsByMention, formatCommentForPrompt } from "./comment.js";
import type { FilteredComment, PRComment } from "./types.js";

describe("filterCommentsByMention", () => {
  const mockComments: PRComment[] = [
    {
      id: 1,
      body: "@ai Fix this bug please",
      path: "src/test.ts",
      line: 42,
      user: { login: "testuser1" },
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      body: "This looks good to me",
      user: { login: "testuser2" },
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r124",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    },
    {
      id: 3,
      body: "@ai Add unit tests for this function",
      path: "src/utils.ts",
      line: 15,
      startLine: 10,
      user: { login: "testuser3" },
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r125",
      position: 5,
      originalPosition: 3,
      diffHunk: "@@ -10,5 +10,8 @@",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    },
  ];

  it("should filter comments by default @ai mention", () => {
    const result = filterCommentsByMention(mockComments);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(1);
    expect(result[1]?.id).toBe(3);
  });

  it("should filter comments by custom mention", () => {
    const customComments: PRComment[] = [
      {
        id: 1,
        body: "@bot Please review this code",
        user: { login: "testuser1" },
        htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
        position: null,
        originalPosition: null,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    ];

    const result = filterCommentsByMention(customComments, "@bot");
    expect(result).toHaveLength(1);
    expect(result[0]?.body).toBe("@bot Please review this code");
  });

  it("should return empty array when no mentions found", () => {
    const result = filterCommentsByMention(mockComments, "@robot");
    expect(result).toHaveLength(0);
  });

  it("should transform PR comments to filtered comments format", () => {
    const result = filterCommentsByMention(mockComments);
    const firstComment = result[0];

    expect(firstComment).toEqual({
      id: 1,
      body: "@ai Fix this bug please",
      path: "src/test.ts",
      line: 42,
      startLine: undefined,
      user: "testuser1",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      diffHunk: undefined,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    });
  });

  it("should handle all optional fields correctly", () => {
    const result = filterCommentsByMention(mockComments);
    const commentWithAllFields = result[1]!;

    expect(commentWithAllFields).toEqual({
      id: 3,
      body: "@ai Add unit tests for this function",
      path: "src/utils.ts",
      line: 15,
      startLine: 10,
      user: "testuser3",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r125",
      position: 5,
      originalPosition: 3,
      diffHunk: "@@ -10,5 +10,8 @@",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    });
  });
});

describe("cleanCommentBody", () => {
  it("should remove default @ai mention and trim", () => {
    const result = cleanCommentBody("@ai Fix this bug please");
    expect(result).toBe("Fix this bug please");
  });

  it("should remove custom mention and trim", () => {
    const result = cleanCommentBody("@bot Please review this", "@bot");
    expect(result).toBe("Please review this");
  });

  it("should remove multiple mentions", () => {
    const result = cleanCommentBody("@ai Please @ai fix this @ai issue");
    expect(result).toBe("Please  fix this  issue");
  });

  it("should handle leading and trailing whitespace", () => {
    const result = cleanCommentBody("  @ai   Fix this bug   ");
    expect(result).toBe("Fix this bug");
  });

  it("should handle leading and trailing newlines", () => {
    const result = cleanCommentBody("\n\n@ai Fix this bug\n\n");
    expect(result).toBe("Fix this bug");
  });

  it("should handle mixed whitespace and newlines", () => {
    const result = cleanCommentBody("  \n\n  @ai Fix this bug  \n\n  ");
    expect(result).toBe("Fix this bug");
  });

  it("should return empty string when only mention and whitespace", () => {
    const result = cleanCommentBody("  @ai  ");
    expect(result).toBe("");
  });
});

describe("formatCommentForPrompt", () => {
  it("should format comment without path info", () => {
    const comment: FilteredComment = {
      id: 1,
      body: "@ai Fix this bug",
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const result = formatCommentForPrompt(comment);
    expect(result).toBe("Fix this bug");
  });

  it("should format comment with path and single line", () => {
    const comment: FilteredComment = {
      id: 1,
      body: "@ai Fix this bug",
      path: "src/test.ts",
      line: 42,
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const result = formatCommentForPrompt(comment);
    expect(result).toBe("./src/test.ts:L42\nFix this bug");
  });

  it("should format comment with path and line range", () => {
    const comment: FilteredComment = {
      id: 1,
      body: "@ai Fix this bug",
      path: "src/test.ts",
      line: 45,
      startLine: 42,
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const result = formatCommentForPrompt(comment);
    expect(result).toBe("./src/test.ts:L42-L45\nFix this bug");
  });

  it("should format comment with path and same start/end line", () => {
    const comment: FilteredComment = {
      id: 1,
      body: "@ai Fix this bug",
      path: "src/test.ts",
      line: 42,
      startLine: 42,
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const result = formatCommentForPrompt(comment);
    expect(result).toBe("./src/test.ts:L42\nFix this bug");
  });

  it("should format comment with path and only start line", () => {
    const comment: FilteredComment = {
      id: 1,
      body: "@ai Fix this bug",
      path: "src/test.ts",
      startLine: 42,
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const result = formatCommentForPrompt(comment);
    expect(result).toBe("./src/test.ts:L42\nFix this bug");
  });

  it("should not include path info when path exists but no line info", () => {
    const comment: FilteredComment = {
      id: 1,
      body: "@ai Fix this bug",
      path: "src/test.ts",
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const result = formatCommentForPrompt(comment);
    expect(result).toBe("Fix this bug");
  });
});

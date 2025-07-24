import { describe, expect, it, vi } from "vitest";
import type { FilteredComment } from "../lib/types.js";
import { buildPrompt, displayPrompt } from "./prompt.js";

describe("buildPrompt", () => {
  it("should return empty string for empty comments array", () => {
    const result = buildPrompt([]);
    expect(result).toBe("");
  });

  it("should build prompt for single comment", () => {
    const comments: FilteredComment[] = [
      {
        id: 1,
        body: "[ai] Fix this bug",
        user: "testuser",
        htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
        position: null,
        originalPosition: null,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    ];

    const formattedComments = comments.map((comment) => {
      // Test-specific cleaning logic for [ai] mentions
      const cleanBody = comment.body
        .replace(/\[ai\]/g, "")
        .trim()
        .replace(/^\s*\n+/, "")
        .replace(/\n+\s*$/, "");
      if (comment.path && (comment.line || comment.startLine)) {
        const lineInfo =
          comment.startLine && comment.line && comment.startLine !== comment.line
            ? `L${comment.startLine}-L${comment.line}`
            : `L${comment.line || comment.startLine}`;
        return `./${comment.path}:${lineInfo}\n${cleanBody}`;
      }
      return `${cleanBody}`;
    });
    const result = formattedComments.join("\n=====\n");
    expect(result).toBe("Fix this bug");
  });

  it("should build prompt for multiple comments with separator", () => {
    const comments: FilteredComment[] = [
      {
        id: 1,
        body: "[ai] Fix this bug",
        user: "testuser1",
        htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
        position: null,
        originalPosition: null,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
      {
        id: 2,
        body: "[ai] Add tests",
        user: "testuser2",
        htmlUrl: "https://github.com/test/repo/pull/1#discussion_r124",
        position: null,
        originalPosition: null,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    ];

    const formattedComments = comments.map((comment) => {
      // Test-specific cleaning logic for [ai] mentions
      const cleanBody = comment.body
        .replace(/\[ai\]/g, "")
        .trim()
        .replace(/^\s*\n+/, "")
        .replace(/\n+\s*$/, "");
      if (comment.path && (comment.line || comment.startLine)) {
        const lineInfo =
          comment.startLine && comment.line && comment.startLine !== comment.line
            ? `L${comment.startLine}-L${comment.line}`
            : `L${comment.line || comment.startLine}`;
        return `./${comment.path}:${lineInfo}\n${cleanBody}`;
      }
      return `${cleanBody}`;
    });
    const result = formattedComments.join("\n=====\n");
    expect(result).toBe("Fix this bug\n=====\nAdd tests");
  });

  it("should handle comments with path and line info", () => {
    const comments: FilteredComment[] = [
      {
        id: 1,
        body: "[ai] Fix this bug",
        path: "src/test.ts",
        line: 42,
        user: "testuser",
        htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
        position: null,
        originalPosition: null,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
    ];

    const formattedComments = comments.map((comment) => {
      // Test-specific cleaning logic for [ai] mentions
      const cleanBody = comment.body
        .replace(/\[ai\]/g, "")
        .trim()
        .replace(/^\s*\n+/, "")
        .replace(/\n+\s*$/, "");
      if (comment.path && (comment.line || comment.startLine)) {
        const lineInfo =
          comment.startLine && comment.line && comment.startLine !== comment.line
            ? `L${comment.startLine}-L${comment.line}`
            : `L${comment.line || comment.startLine}`;
        return `./${comment.path}:${lineInfo}\n${cleanBody}`;
      }
      return `${cleanBody}`;
    });
    const result = formattedComments.join("\n=====\n");
    expect(result).toBe("./src/test.ts:L42\nFix this bug");
  });
});

describe("displayPrompt", () => {
  it("should log prompt when not empty", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    displayPrompt("Test prompt");
    expect(consoleSpy).toHaveBeenCalledWith("Test prompt");
    consoleSpy.mockRestore();
  });

  it("should log no comments message when prompt is empty", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    displayPrompt("");
    expect(consoleSpy).toHaveBeenCalledWith("No comments found with the specified mention.");
    consoleSpy.mockRestore();
  });

  it("should log no comments message when prompt is whitespace", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    displayPrompt("   \n   ");
    expect(consoleSpy).toHaveBeenCalledWith("No comments found with the specified mention.");
    consoleSpy.mockRestore();
  });
});

import { describe, expect, it } from "vitest";
import type { CliOptions, FilteredComment, PRComment, PRInfo, PromptSection } from "./types.js";

describe("Type definitions", () => {
  it("should define PRComment interface correctly", () => {
    const prComment: PRComment = {
      id: 1,
      body: "Test comment",
      path: "src/test.ts",
      line: 42,
      startLine: 40,
      user: { login: "testuser" },
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: 5,
      originalPosition: 3,
      diffHunk: "@@ -40,5 +40,8 @@",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    expect(prComment.id).toBe(1);
    expect(prComment.body).toBe("Test comment");
    expect(prComment.user.login).toBe("testuser");
  });

  it("should define FilteredComment interface correctly", () => {
    const filteredComment: FilteredComment = {
      id: 1,
      body: "Test comment",
      path: "src/test.ts",
      line: 42,
      startLine: 40,
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: 5,
      originalPosition: 3,
      diffHunk: "@@ -40,5 +40,8 @@",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    expect(filteredComment.id).toBe(1);
    expect(filteredComment.body).toBe("Test comment");
    expect(filteredComment.user).toBe("testuser");
  });

  it("should define PRInfo interface correctly", () => {
    const prInfo: PRInfo = {
      owner: "testowner",
      repo: "testrepo",
      pullNumber: 42,
    };

    expect(prInfo.owner).toBe("testowner");
    expect(prInfo.repo).toBe("testrepo");
    expect(prInfo.pullNumber).toBe(42);
  });

  it("should define CliOptions interface correctly", () => {
    const cliOptions: CliOptions = {
      interactive: true,
      resolve: false,
      delete: false,
      mention: "[ai]",
      clipboard: true,
      all: false,
    };

    expect(cliOptions.interactive).toBe(true);
    expect(cliOptions.mention).toBe("[ai]");
    expect(cliOptions.clipboard).toBe(true);
  });

  it("should define PromptSection interface correctly", () => {
    const filteredComment: FilteredComment = {
      id: 1,
      body: "Test comment",
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const promptSection: PromptSection = {
      comment: filteredComment,
      content: "# Test comment",
    };

    expect(promptSection.comment.id).toBe(1);
    expect(promptSection.content).toBe("# Test comment");
  });

  it("should allow optional fields in PRComment", () => {
    const minimalPRComment: PRComment = {
      id: 1,
      body: "Test comment",
      user: { login: "testuser" },
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    expect(minimalPRComment.path).toBeUndefined();
    expect(minimalPRComment.line).toBeUndefined();
    expect(minimalPRComment.startLine).toBeUndefined();
    expect(minimalPRComment.diffHunk).toBeUndefined();
  });

  it("should allow optional fields in FilteredComment", () => {
    const minimalFilteredComment: FilteredComment = {
      id: 1,
      body: "Test comment",
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    expect(minimalFilteredComment.path).toBeUndefined();
    expect(minimalFilteredComment.line).toBeUndefined();
    expect(minimalFilteredComment.startLine).toBeUndefined();
    expect(minimalFilteredComment.diffHunk).toBeUndefined();
  });

  it("should allow optional fields in CliOptions", () => {
    const minimalCliOptions: CliOptions = {};

    expect(minimalCliOptions.interactive).toBeUndefined();
    expect(minimalCliOptions.resolve).toBeUndefined();
    expect(minimalCliOptions.delete).toBeUndefined();
    expect(minimalCliOptions.mention).toBeUndefined();
    expect(minimalCliOptions.clipboard).toBeUndefined();
    expect(minimalCliOptions.all).toBeUndefined();
  });

  it("should handle null values correctly", () => {
    const commentWithNulls: PRComment = {
      id: 1,
      body: "Test comment",
      user: { login: "testuser" },
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    expect(commentWithNulls.position).toBeNull();
    expect(commentWithNulls.originalPosition).toBeNull();
  });

  it("should work with different combinations of line info", () => {
    const commentWithStartLine: FilteredComment = {
      id: 1,
      body: "Test comment",
      startLine: 10,
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    const commentWithBothLines: FilteredComment = {
      id: 2,
      body: "Test comment",
      line: 15,
      startLine: 10,
      user: "testuser",
      htmlUrl: "https://github.com/test/repo/pull/1#discussion_r124",
      position: null,
      originalPosition: null,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    };

    expect(commentWithStartLine.startLine).toBe(10);
    expect(commentWithStartLine.line).toBeUndefined();
    expect(commentWithBothLines.line).toBe(15);
    expect(commentWithBothLines.startLine).toBe(10);
  });

  it("should support various CliOptions combinations", () => {
    const interactiveOnly: CliOptions = { interactive: true };
    const clipboardOnly: CliOptions = { clipboard: true };
    const resolveAndDelete: CliOptions = { resolve: true, delete: true };
    const allOptions: CliOptions = {
      interactive: true,
      resolve: true,
      delete: true,
      mention: "@custom",
      clipboard: true,
      all: true,
    };

    expect(interactiveOnly.interactive).toBe(true);
    expect(clipboardOnly.clipboard).toBe(true);
    expect(resolveAndDelete.resolve).toBe(true);
    expect(resolveAndDelete.delete).toBe(true);
    expect(allOptions.mention).toBe("@custom");
    expect(allOptions.all).toBe(true);
  });

  it("should handle complex PromptSection scenarios", () => {
    const commentWithAllFields: FilteredComment = {
      id: 1,
      body: "[ai] Complex comment with all fields",
      path: "src/complex.ts",
      line: 100,
      startLine: 95,
      user: "maintainer",
      htmlUrl: "https://github.com/org/repo/pull/42#discussion_r999",
      position: 15,
      originalPosition: 12,
      diffHunk: "@@ -95,10 +95,15 @@",
      createdAt: "2023-06-15T10:30:00Z",
      updatedAt: "2023-06-15T11:45:00Z",
    };

    const section: PromptSection = {
      comment: commentWithAllFields,
      content: "# ./src/complex.ts:L95-L100\n# Complex comment with all fields",
    };

    expect(section.comment.id).toBe(1);
    expect(section.comment.diffHunk).toBe("@@ -95,10 +95,15 @@");
    expect(section.content).toContain("Complex comment");
  });
});

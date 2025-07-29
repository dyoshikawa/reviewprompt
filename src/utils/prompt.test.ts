import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FilteredComment } from "../lib/types.js";
import { buildPrompt, displayPrompt } from "./prompt.js";

describe("prompt utilities", () => {
  describe("buildPrompt", () => {
    it("should return empty string for empty comments array", () => {
      const result = buildPrompt([]);
      expect(result).toBe("");
    });

    it("should build prompt for single comment", () => {
      const comments: FilteredComment[] = [
        {
          id: 1,
          body: "Test comment",
          path: "src/test.ts",
          line: 10,
          startLine: 8,
          user: "testuser",
          htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
          position: 5,
          originalPosition: 3,
          diffHunk: "@@ -8,3 +8,5 @@",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
          isResolved: false,
        },
      ];

      const result = buildPrompt(comments);
      expect(result).toContain("Test comment");
      expect(result).toContain("src/test.ts");
      expect(result).toContain("L8-L10");
    });

    it("should build prompt for multiple comments with separator", () => {
      const comments: FilteredComment[] = [
        {
          id: 1,
          body: "First comment",
          path: "src/test1.ts",
          line: 10,
          startLine: 8,
          user: "user1",
          htmlUrl: "https://github.com/test/repo/pull/1#discussion_r123",
          position: 5,
          originalPosition: 3,
          diffHunk: "@@ -8,3 +8,5 @@",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
          isResolved: false,
        },
        {
          id: 2,
          body: "Second comment",
          path: "src/test2.ts",
          line: 20,
          startLine: 18,
          user: "user2",
          htmlUrl: "https://github.com/test/repo/pull/1#discussion_r124",
          position: 15,
          originalPosition: 13,
          diffHunk: "@@ -18,3 +18,5 @@",
          createdAt: "2023-01-01T01:00:00Z",
          updatedAt: "2023-01-01T01:00:00Z",
          isResolved: false,
        },
      ];

      const result = buildPrompt(comments);
      expect(result).toContain("First comment");
      expect(result).toContain("Second comment");
      expect(result).toContain("\n=====\n");
    });
  });

  describe("displayPrompt", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Mock console.log
      vi.spyOn(console, "log").mockImplementation(() => {});
    });

    it("should display prompt when content is not empty", () => {
      const prompt = "Test prompt content";
      displayPrompt(prompt);

      expect(console.log).toHaveBeenCalledWith("Test prompt content");
    });

    it("should display no comments message when prompt is empty", () => {
      displayPrompt("");

      expect(console.log).toHaveBeenCalledWith("No comments found with the specified mention.");
    });

    it("should display no comments message when prompt is only whitespace", () => {
      displayPrompt("   \n\t  ");

      expect(console.log).toHaveBeenCalledWith("No comments found with the specified mention.");
    });

    it("should display prompt when content has meaningful text with whitespace", () => {
      const prompt = "  \n  Test content  \n  ";
      displayPrompt(prompt);

      expect(console.log).toHaveBeenCalledWith("  \n  Test content  \n  ");
    });
  });
});

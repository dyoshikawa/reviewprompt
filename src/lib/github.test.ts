import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock functions - declare before any vi.mock calls
const mockGraphql = vi.fn();

import { graphql } from "@octokit/graphql";
import { createAuthErrorMessage, getGithubToken } from "../utils/auth.js";
import { GitHubClient } from "./github.js";

// Mock GraphQL
vi.mock("@octokit/graphql");

// Mock the auth utilities
vi.mock("../utils/auth.js", () => ({
  getGithubToken: vi.fn(),
  createAuthErrorMessage: vi.fn(),
}));

describe("GitHubClient", () => {
  let client: GitHubClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGithubToken).mockReturnValue("test-token");
    vi.mocked(createAuthErrorMessage).mockImplementation(
      (error) => `GitHub API error: ${error.message}`,
    );
    // Setup graphql mock
    (graphql.defaults as any).mockReturnValue(mockGraphql);
    client = new GitHubClient("test-token");
  });

  describe("parsePRUrl", () => {
    it("should parse valid GitHub PR URL", () => {
      const url = "https://github.com/owner/repo/pull/123";
      const result = client.parsePRUrl(url);

      expect(result).toEqual({
        owner: "owner",
        repo: "repo",
        pullNumber: 123,
      });
    });

    it("should parse URL with additional path segments", () => {
      const url = "https://github.com/owner/repo/pull/456/files";
      const result = client.parsePRUrl(url);

      expect(result).toEqual({
        owner: "owner",
        repo: "repo",
        pullNumber: 456,
      });
    });

    it("should throw error for invalid URL format", () => {
      const invalidUrls = [
        "https://github.com/owner/repo",
        "https://github.com/owner",
        "https://github.com",
        "https://gitlab.com/owner/repo/pull/123",
        "not-a-url",
        "",
      ];

      for (const url of invalidUrls) {
        expect(() => client.parsePRUrl(url)).toThrow("Invalid GitHub PR URL format");
      }
    });

    it("should handle URLs with dashes and underscores in names", () => {
      const url = "https://github.com/my-org/my_repo/pull/789";
      const result = client.parsePRUrl(url);

      expect(result).toEqual({
        owner: "my-org",
        repo: "my_repo",
        pullNumber: 789,
      });
    });
  });

  describe("constructor", () => {
    it("should use provided token", () => {
      const testClient = new GitHubClient("custom-token");
      expect(testClient).toBeInstanceOf(GitHubClient);
    });

    it("should use getGithubToken when no token provided", () => {
      vi.mocked(getGithubToken).mockReturnValue("auth-token");

      const testClient = new GitHubClient();
      expect(testClient).toBeInstanceOf(GitHubClient);
      expect(getGithubToken).toHaveBeenCalled();
    });

    it("should throw error when no token is available", () => {
      vi.mocked(getGithubToken).mockReturnValue(undefined);

      expect(() => new GitHubClient()).toThrow(
        "GitHub authentication required. Please set GITHUB_TOKEN environment variable or authenticate with GitHub CLI (gh auth login).",
      );
    });
  });

  describe("getReviewComments", () => {
    it("should handle successful API response", async () => {
      const mockGraphQLResponse = {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: "THREAD_1",
                  isResolved: false,
                  comments: {
                    nodes: [
                      {
                        id: "COMMENT_1",
                        databaseId: 1,
                        body: "Test comment",
                        path: "src/test.ts",
                        line: 42,
                        startLine: 40,
                        author: { login: "testuser" },
                        url: "https://github.com/test/repo/pull/1#discussion_r123",
                        position: 5,
                        originalPosition: 3,
                        diffHunk: "@@ -40,5 +40,8 @@",
                        createdAt: "2023-01-01T00:00:00Z",
                        updatedAt: "2023-01-01T00:00:00Z",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      };

      mockGraphql.mockResolvedValueOnce(mockGraphQLResponse);

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };
      const result = await client.getReviewComments(prInfo);

      expect(mockGraphql).toHaveBeenCalledWith(expect.stringContaining("reviewThreads"), {
        owner: "test",
        repo: "repo",
        number: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
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
        isResolved: false,
      });
    });

    it("should handle null/undefined values in API response", async () => {
      const mockGraphQLResponse = {
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: "THREAD_2",
                  isResolved: true,
                  comments: {
                    nodes: [
                      {
                        id: "COMMENT_2",
                        databaseId: 2,
                        body: "Another comment",
                        path: null,
                        line: null,
                        startLine: null,
                        author: null,
                        url: "https://github.com/test/repo/pull/1#discussion_r124",
                        position: null,
                        originalPosition: null,
                        diffHunk: null,
                        createdAt: "2023-01-01T01:00:00Z",
                        updatedAt: "2023-01-01T01:00:00Z",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      };

      mockGraphql.mockResolvedValueOnce(mockGraphQLResponse);

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };
      const result = await client.getReviewComments(prInfo);

      expect(result[0]).toEqual({
        id: 2,
        body: "Another comment",
        path: undefined,
        line: undefined,
        startLine: undefined,
        user: { login: "unknown" },
        htmlUrl: "https://github.com/test/repo/pull/1#discussion_r124",
        position: null,
        originalPosition: null,
        diffHunk: undefined,
        createdAt: "2023-01-01T01:00:00Z",
        updatedAt: "2023-01-01T01:00:00Z",
        isResolved: true,
      });
    });

    it("should throw authentication error for auth issues", async () => {
      const mockError = new Error("Bad credentials");
      vi.mocked(createAuthErrorMessage).mockReturnValue(
        "GitHub authentication failed. Please ensure you have a valid token",
      );
      mockGraphql.mockRejectedValueOnce(mockError);

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };

      await expect(client.getReviewComments(prInfo)).rejects.toThrow(
        "GitHub authentication failed. Please ensure you have a valid token",
      );
    });

    it("should throw error with Error instance", async () => {
      const mockError = new Error("API Error");
      mockGraphql.mockRejectedValueOnce(mockError);

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };

      await expect(client.getReviewComments(prInfo)).rejects.toThrow(
        "Failed to fetch PR comments: API Error",
      );
    });

    it("should throw generic error with non-Error instance", async () => {
      mockGraphql.mockRejectedValueOnce("String error");

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };

      await expect(client.getReviewComments(prInfo)).rejects.toThrow("Failed to fetch PR comments");
    });
  });

  describe("resolveComment", () => {
    it("should resolve comment successfully", async () => {
      // Mock the query to find review threads
      mockGraphql.mockResolvedValueOnce({
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  id: "TEST_THREAD_ID_456",
                  comments: {
                    nodes: [{ id: "TEST_COMMENT_NODE_ID_123", databaseId: 123 }],
                  },
                },
              ],
            },
          },
        },
      });

      // Mock the mutation to resolve the thread
      mockGraphql.mockResolvedValueOnce({
        resolveReviewThread: {
          thread: {
            id: "TEST_THREAD_ID_456",
            isResolved: true,
          },
        },
      });

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };
      await client.resolveComment(prInfo, 123);

      expect(mockGraphql).toHaveBeenCalledTimes(2);
      expect(mockGraphql).toHaveBeenNthCalledWith(1, expect.stringContaining("query"), {
        owner: "test",
        repo: "repo",
        number: 1,
      });
      expect(mockGraphql).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("resolveReviewThread"),
        {
          threadId: "TEST_THREAD_ID_456",
        },
      );
    });

    it("should throw error with Error instance", async () => {
      const mockError = new Error("Not found");
      mockGraphql.mockRejectedValueOnce(mockError);

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };

      await expect(client.resolveComment(prInfo, 123)).rejects.toThrow(
        "Failed to resolve comment: Not found",
      );
    });

    it("should throw generic error with non-Error instance", async () => {
      mockGraphql.mockRejectedValueOnce("String error");

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };

      await expect(client.resolveComment(prInfo, 123)).rejects.toThrow("Failed to resolve comment");
    });
  });

  describe("deleteComment", () => {
    it("should delete comment successfully", async () => {
      // Mock the query to find review threads and comment node ID
      mockGraphql.mockResolvedValueOnce({
        repository: {
          pullRequest: {
            reviewThreads: {
              nodes: [
                {
                  comments: {
                    nodes: [
                      {
                        id: "TEST_COMMENT_NODE_456",
                        databaseId: 456,
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      });

      // Mock the delete mutation
      mockGraphql.mockResolvedValueOnce({
        deleteComment: {
          clientMutationId: "test",
        },
      });

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };
      await client.deleteComment(prInfo, 456);

      expect(mockGraphql).toHaveBeenCalledTimes(2);
      expect(mockGraphql).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("deletePullRequestReviewComment"),
        {
          nodeId: "TEST_COMMENT_NODE_456",
        },
      );
    });

    it("should throw error with Error instance", async () => {
      const mockError = new Error("Permission denied");
      mockGraphql.mockRejectedValueOnce(mockError);

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };

      await expect(client.deleteComment(prInfo, 456)).rejects.toThrow(
        "Failed to delete comment: Permission denied",
      );
    });

    it("should throw generic error with non-Error instance", async () => {
      mockGraphql.mockRejectedValueOnce("String error");

      const prInfo = { owner: "test", repo: "repo", pullNumber: 1 };

      await expect(client.deleteComment(prInfo, 456)).rejects.toThrow("Failed to delete comment");
    });
  });
});

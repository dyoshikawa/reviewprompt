import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { createAuthErrorMessage, getGithubToken } from "../utils/auth.js";
import type { PRComment, PRInfo } from "./types.js";

// Helper function to safely access nested properties
const getNestedValue = (obj: unknown, path: string[]): unknown => {
  let current = obj;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) {
      return undefined;
    }
    // eslint-disable-next-line no-type-assertion/no-type-assertion
    const currentRecord = current as Record<string, unknown>;
    current = currentRecord[key];
  }
  return current;
};

export class GitHubClient {
  private octokit: Octokit;
  private graphqlWithAuth: typeof graphql;

  constructor(token?: string) {
    const authToken = token || getGithubToken();
    if (!authToken) {
      throw new Error(
        "GitHub authentication required. Please set GITHUB_TOKEN environment variable or authenticate with GitHub CLI (gh auth login).",
      );
    }

    this.octokit = new Octokit({
      auth: authToken,
    });

    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${authToken}`,
      },
    });
  }

  public parsePRUrl(url: string): PRInfo {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match || !match[1] || !match[2] || !match[3]) {
      throw new Error("Invalid GitHub PR URL format");
    }

    return {
      owner: match[1],
      repo: match[2],
      pullNumber: parseInt(match[3], 10),
    };
  }

  public async getReviewComments(prInfo: PRInfo): Promise<PRComment[]> {
    try {
      const { data } = await this.octokit.rest.pulls.listReviewComments({
        owner: prInfo.owner,
        repo: prInfo.repo,
        pull_number: prInfo.pullNumber,
      });

      return data.map((comment) => ({
        id: comment.id,
        body: comment.body,
        path: comment.path || undefined,
        line: comment.line || undefined,
        startLine: comment.start_line || undefined,
        user: {
          login: comment.user?.login || "unknown",
        },
        htmlUrl: comment.html_url,
        position: comment.position || null,
        originalPosition: comment.original_position || null,
        diffHunk: comment.diff_hunk || undefined,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      }));
    } catch (error) {
      if (error instanceof Error) {
        const authError = createAuthErrorMessage(error);
        if (authError !== `GitHub API error: ${error.message}`) {
          throw new Error(authError);
        }
        throw new Error(`Failed to fetch PR comments: ${error.message}`);
      }
      throw new Error("Failed to fetch PR comments");
    }
  }

  public async resolveComment(prInfo: PRInfo, commentId: number): Promise<void> {
    try {
      // First, get the pull request review comment to get its node_id
      const { data: comment } = await this.octokit.rest.pulls.getReviewComment({
        owner: prInfo.owner,
        repo: prInfo.repo,
        comment_id: commentId,
      });

      // Use GraphQL to find the review thread containing this comment
      const query = `
        query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              reviewThreads(first: 100) {
                nodes {
                  id
                  comments(first: 100) {
                    nodes {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const queryResult = await this.graphqlWithAuth(query, {
        owner: prInfo.owner,
        repo: prInfo.repo,
        number: prInfo.pullNumber,
      });

      // Type-safe navigation of GraphQL response
      if (!queryResult || typeof queryResult !== "object") {
        throw new Error("Invalid GraphQL response structure");
      }

      const reviewThreadsNodes = getNestedValue(queryResult, [
        "repository",
        "pullRequest",
        "reviewThreads",
        "nodes",
      ]);

      if (!Array.isArray(reviewThreadsNodes)) {
        throw new Error("Invalid GraphQL response structure");
      }

      // Find the thread that contains our comment
      let threadId: string | null = null;

      for (const thread of reviewThreadsNodes) {
        if (!thread || typeof thread !== "object") continue;

        // eslint-disable-next-line no-type-assertion/no-type-assertion
        const threadObj = thread as Record<string, unknown>;

        // Get thread id
        const threadIdValue = threadObj.id;
        if (typeof threadIdValue !== "string") continue;

        // Get comments
        const comments = threadObj.comments;
        if (!comments || typeof comments !== "object") continue;

        // eslint-disable-next-line no-type-assertion/no-type-assertion
        const commentsObj = comments as Record<string, unknown>;
        const nodes = commentsObj.nodes;
        if (!Array.isArray(nodes)) continue;

        // Extract comment IDs
        const commentIds: string[] = [];
        for (const node of nodes) {
          if (node && typeof node === "object" && "id" in node) {
            // eslint-disable-next-line no-type-assertion/no-type-assertion
            const nodeObj = node as Record<string, unknown>;
            if (typeof nodeObj.id === "string") {
              commentIds.push(nodeObj.id);
            }
          }
        }

        // Check if this thread contains our comment
        if (commentIds.includes(comment.node_id)) {
          threadId = threadIdValue;
          break;
        }
      }

      if (!threadId) {
        throw new Error(`Could not find review thread for comment ${commentId}`);
      }

      // Use GraphQL to resolve the review thread
      const mutation = `
        mutation($threadId: ID!) {
          resolveReviewThread(input: {threadId: $threadId}) {
            thread {
              id
              isResolved
            }
          }
        }
      `;

      await this.graphqlWithAuth(mutation, {
        threadId: threadId,
      });
    } catch (error) {
      if (error instanceof Error) {
        const authError = createAuthErrorMessage(error);
        if (authError !== `GitHub API error: ${error.message}`) {
          throw new Error(authError);
        }
        throw new Error(`Failed to resolve comment: ${error.message}`);
      }
      throw new Error("Failed to resolve comment");
    }
  }

  public async deleteComment(prInfo: PRInfo, commentId: number): Promise<void> {
    try {
      await this.octokit.rest.pulls.deleteReviewComment({
        owner: prInfo.owner,
        repo: prInfo.repo,
        comment_id: commentId,
      });
    } catch (error) {
      if (error instanceof Error) {
        const authError = createAuthErrorMessage(error);
        if (authError !== `GitHub API error: ${error.message}`) {
          throw new Error(authError);
        }
        throw new Error(`Failed to delete comment: ${error.message}`);
      }
      throw new Error("Failed to delete comment");
    }
  }
}

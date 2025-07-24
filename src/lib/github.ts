import { graphql } from "@octokit/graphql";
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
  private graphqlWithAuth: typeof graphql;

  constructor(token?: string) {
    const authToken = token || getGithubToken();
    if (!authToken) {
      throw new Error(
        "GitHub authentication required. Please set GITHUB_TOKEN environment variable or authenticate with GitHub CLI (gh auth login).",
      );
    }

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
      // Use GraphQL API to get all review comments with resolve status
      const query = `
        query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              reviewThreads(first: 100) {
                nodes {
                  id
                  isResolved
                  comments(first: 100) {
                    nodes {
                      id
                      databaseId
                      body
                      path
                      line
                      startLine
                      author {
                        login
                      }
                      url
                      position
                      originalPosition
                      diffHunk
                      createdAt
                      updatedAt
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

      const comments: PRComment[] = [];

      if (queryResult && typeof queryResult === "object") {
        const reviewThreadsNodes = getNestedValue(queryResult, [
          "repository",
          "pullRequest",
          "reviewThreads",
          "nodes",
        ]);

        if (Array.isArray(reviewThreadsNodes)) {
          for (const thread of reviewThreadsNodes) {
            if (!thread || typeof thread !== "object") continue;

            // eslint-disable-next-line no-type-assertion/no-type-assertion
            const threadObj = thread as Record<string, unknown>;
            const isResolved = threadObj.isResolved === true;
            const threadComments = threadObj.comments;

            if (!threadComments || typeof threadComments !== "object") continue;

            // eslint-disable-next-line no-type-assertion/no-type-assertion
            const commentsObj = threadComments as Record<string, unknown>;
            const nodes = commentsObj.nodes;

            if (!Array.isArray(nodes)) continue;

            for (const node of nodes) {
              if (node && typeof node === "object") {
                // eslint-disable-next-line no-type-assertion/no-type-assertion
                const commentNode = node as Record<string, unknown>;

                if (
                  typeof commentNode.databaseId === "number" &&
                  typeof commentNode.body === "string"
                ) {
                  comments.push({
                    id: commentNode.databaseId,
                    body: commentNode.body,
                    path: typeof commentNode.path === "string" ? commentNode.path : undefined,
                    line: typeof commentNode.line === "number" ? commentNode.line : undefined,
                    startLine:
                      typeof commentNode.startLine === "number" ? commentNode.startLine : undefined,
                    user: {
                      login:
                        commentNode.author &&
                        typeof commentNode.author === "object" &&
                        "login" in commentNode.author &&
                        // eslint-disable-next-line no-type-assertion/no-type-assertion
                        typeof (commentNode.author as Record<string, unknown>).login === "string"
                          ? // eslint-disable-next-line no-type-assertion/no-type-assertion
                            ((commentNode.author as Record<string, unknown>).login as string)
                          : "unknown",
                    },
                    htmlUrl: typeof commentNode.url === "string" ? commentNode.url : "",
                    position:
                      typeof commentNode.position === "number" ? commentNode.position : null,
                    originalPosition:
                      typeof commentNode.originalPosition === "number"
                        ? commentNode.originalPosition
                        : null,
                    diffHunk:
                      typeof commentNode.diffHunk === "string" ? commentNode.diffHunk : undefined,
                    createdAt:
                      typeof commentNode.createdAt === "string" ? commentNode.createdAt : "",
                    updatedAt:
                      typeof commentNode.updatedAt === "string" ? commentNode.updatedAt : "",
                    isResolved,
                  });
                }
              }
            }
          }
        }
      }

      return comments;
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
                      databaseId
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

        // Check if this thread contains our comment (using databaseId)
        for (const node of nodes) {
          if (node && typeof node === "object" && "databaseId" in node) {
            // eslint-disable-next-line no-type-assertion/no-type-assertion
            const nodeObj = node as Record<string, unknown>;
            if (nodeObj.databaseId === commentId) {
              threadId = threadIdValue;
              break;
            }
          }
        }

        if (threadId) break;
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
      // First, find the GraphQL node ID for the comment
      const query = `
        query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              reviewThreads(first: 100) {
                nodes {
                  comments(first: 100) {
                    nodes {
                      id
                      databaseId
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

      // Find the comment's GraphQL node ID
      let nodeId: string | null = null;

      if (queryResult && typeof queryResult === "object") {
        const reviewThreadsNodes = getNestedValue(queryResult, [
          "repository",
          "pullRequest",
          "reviewThreads",
          "nodes",
        ]);

        if (Array.isArray(reviewThreadsNodes)) {
          for (const thread of reviewThreadsNodes) {
            if (!thread || typeof thread !== "object") continue;

            // eslint-disable-next-line no-type-assertion/no-type-assertion
            const threadObj = thread as Record<string, unknown>;
            const comments = threadObj.comments;

            if (!comments || typeof comments !== "object") continue;

            // eslint-disable-next-line no-type-assertion/no-type-assertion
            const commentsObj = comments as Record<string, unknown>;
            const nodes = commentsObj.nodes;

            if (!Array.isArray(nodes)) continue;

            for (const node of nodes) {
              if (node && typeof node === "object" && "databaseId" in node && "id" in node) {
                // eslint-disable-next-line no-type-assertion/no-type-assertion
                const nodeObj = node as Record<string, unknown>;
                if (nodeObj.databaseId === commentId && typeof nodeObj.id === "string") {
                  nodeId = nodeObj.id;
                  break;
                }
              }
            }

            if (nodeId) break;
          }
        }
      }

      if (!nodeId) {
        throw new Error(`Could not find GraphQL node ID for comment ${commentId}`);
      }

      // Use GraphQL mutation to delete the comment
      const mutation = `
        mutation($nodeId: ID!) {
          deleteComment: deletePullRequestReviewComment(input: {id: $nodeId}) {
            clientMutationId
          }
        }
      `;

      await this.graphqlWithAuth(mutation, {
        nodeId,
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

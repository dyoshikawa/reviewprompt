import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { createAuthErrorMessage, getGithubToken } from "../utils/auth.js";
import type { PRComment, PRInfo } from "./types.js";

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
      // First, get the pull request review comment to find the thread ID
      const { data: comment } = await this.octokit.rest.pulls.getReviewComment({
        owner: prInfo.owner,
        repo: prInfo.repo,
        comment_id: commentId,
      });

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

      // The thread ID is the node_id of the comment
      await this.graphqlWithAuth(mutation, {
        threadId: comment.node_id,
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

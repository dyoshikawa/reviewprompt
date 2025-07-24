// Forked from https://github.com/yoshiko-pg/difit/blob/main/src/cli/utils.ts
import { execSync } from "node:child_process";

export function getGithubToken(): string | undefined {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  try {
    const result = execSync("gh auth token", { encoding: "utf8", stdio: "pipe" });
    return result.trim();
  } catch {
    return undefined;
  }
}

export function createAuthErrorMessage(error: Error): string {
  const message = error.message;

  if (message.includes("Bad credentials") || message.includes("401")) {
    return [
      "GitHub authentication failed. Please ensure you have a valid token:",
      "1. Set GITHUB_TOKEN environment variable with a personal access token",
      "2. Or authenticate with GitHub CLI: gh auth login",
      "",
      "For GitHub.com, create a token at: https://github.com/settings/tokens",
      "For GitHub Enterprise, contact your administrator for token generation.",
    ].join("\n");
  }

  if (message.includes("403")) {
    return [
      "GitHub API rate limit exceeded or insufficient permissions.",
      "Please check your token permissions or wait before retrying.",
    ].join("\n");
  }

  return `GitHub API error: ${message}`;
}

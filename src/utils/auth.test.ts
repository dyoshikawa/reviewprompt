import { execSync } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthErrorMessage, getGithubToken } from "./auth.js";

vi.mock("node:child_process");

const mockExecSync = vi.mocked(execSync);

describe("getGithubToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
  });

  it("should return GITHUB_TOKEN from environment variable", () => {
    process.env.GITHUB_TOKEN = "env-token-123";

    const result = getGithubToken();

    expect(result).toBe("env-token-123");
    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it("should fallback to GitHub CLI when environment variable is not set", () => {
    mockExecSync.mockReturnValueOnce("cli-token-456\n");

    const result = getGithubToken();

    expect(result).toBe("cli-token-456");
    expect(mockExecSync).toHaveBeenCalledWith("gh auth token", {
      encoding: "utf8",
      stdio: "pipe",
    });
  });

  it("should trim whitespace from GitHub CLI output", () => {
    mockExecSync.mockReturnValueOnce("  cli-token-789  \n");

    const result = getGithubToken();

    expect(result).toBe("cli-token-789");
  });

  it("should return undefined when GitHub CLI fails", () => {
    mockExecSync.mockImplementationOnce(() => {
      throw new Error("GitHub CLI not found");
    });

    const result = getGithubToken();

    expect(result).toBeUndefined();
  });

  it("should prefer environment variable over GitHub CLI", () => {
    process.env.GITHUB_TOKEN = "env-token";
    mockExecSync.mockReturnValueOnce("cli-token");

    const result = getGithubToken();

    expect(result).toBe("env-token");
    expect(mockExecSync).not.toHaveBeenCalled();
  });
});

describe("createAuthErrorMessage", () => {
  it("should return authentication error message for 401 errors", () => {
    const error = new Error("Request failed with status code 401");

    const result = createAuthErrorMessage(error);

    expect(result).toContain("GitHub authentication failed");
    expect(result).toContain("Set GITHUB_TOKEN environment variable");
    expect(result).toContain("gh auth login");
    expect(result).toContain("https://github.com/settings/tokens");
  });

  it("should return authentication error message for Bad credentials", () => {
    const error = new Error("Bad credentials");

    const result = createAuthErrorMessage(error);

    expect(result).toContain("GitHub authentication failed");
  });

  it("should return rate limit message for 403 errors", () => {
    const error = new Error("Request failed with status code 403");

    const result = createAuthErrorMessage(error);

    expect(result).toContain("GitHub API rate limit exceeded");
    expect(result).toContain("check your token permissions");
  });

  it("should return generic error message for other errors", () => {
    const error = new Error("Network timeout");

    const result = createAuthErrorMessage(error);

    expect(result).toBe("GitHub API error: Network timeout");
  });

  it("should handle errors with different status code formats", () => {
    const error = new Error("HTTP 401 Unauthorized");

    const result = createAuthErrorMessage(error);

    expect(result).toContain("GitHub authentication failed");
  });
});

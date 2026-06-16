import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { projectRoot, runCli } from "./e2e-helper.js";

/**
 * End-to-end tests that spawn the real `reviewprompt` CLI process.
 *
 * These cover the behavior that does not require GitHub network access or
 * authentication: version/help output, argument parsing, URL validation and
 * exit codes. Network-dependent flows are covered by unit/integration tests
 * with mocked clients instead.
 */
describe("reviewprompt CLI (e2e)", () => {
  const pkg = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8")) as {
    version: string;
  };

  // A non-empty token short-circuits the auth check so validation logic runs
  // deterministically without hitting the network or the `gh` CLI.
  const fakeTokenEnv = { GITHUB_TOKEN: "ghp_fake_token_for_e2e_testing" };

  // Force the "no authentication available" path deterministically: unset every
  // token env var and point the `gh` CLI at an empty config dir so that
  // `gh auth token` fails and `getGithubToken()` returns undefined. This stays
  // fully offline because the auth check throws before any network request.
  const ghConfigDir = path.join(tmpdir(), "reviewprompt-e2e-empty-gh-config");
  const noAuthEnv = {
    GITHUB_TOKEN: undefined,
    GH_TOKEN: undefined,
    GH_CONFIG_DIR: ghConfigDir,
  };

  beforeAll(() => {
    mkdirSync(ghConfigDir, { recursive: true });
  });

  describe("--version", () => {
    it("prints the package version", async () => {
      const result = await runCli(["--version"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe(pkg.version);
    });

    it("supports the -V short flag", async () => {
      const result = await runCli(["-V"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe(pkg.version);
    });
  });

  describe("--help", () => {
    it("prints usage and exits successfully", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("reviewprompt");
      expect(result.stdout).toContain("GitHub PR review comments to AI prompt CLI tool");
    });

    it("lists the main options", async () => {
      const result = await runCli(["--help"]);

      expect(result.stdout).toContain("--all");
      expect(result.stdout).toContain("--interactive");
      expect(result.stdout).toContain("--resolve");
      expect(result.stdout).toContain("--delete");
      expect(result.stdout).toContain("--mention");
      expect(result.stdout).toContain("--clipboard");
    });

    it("lists the resolve and delete subcommands", async () => {
      const result = await runCli(["--help"]);

      expect(result.stdout).toContain("resolve");
      expect(result.stdout).toContain("delete");
    });

    it("documents the pr-url argument and the default mention", async () => {
      const result = await runCli(["--help"]);

      expect(result.stdout).toContain("pr-url");
      expect(result.stdout).toContain("[ai]");
    });

    it("supports the -h short flag", async () => {
      const result = await runCli(["-h"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });
  });

  describe("subcommand help", () => {
    it("prints help for the resolve subcommand", async () => {
      const result = await runCli(["resolve", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("resolve");
      expect(result.stdout).toContain("<pr-url>");
      expect(result.stdout).toContain("--mention");
      expect(result.stdout).toContain("--all");
    });

    it("prints help for the delete subcommand", async () => {
      const result = await runCli(["delete", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("delete");
      expect(result.stdout).toContain("<pr-url>");
      expect(result.stdout).toContain("--mention");
      expect(result.stdout).toContain("--all");
    });
  });

  describe("argument validation", () => {
    it("fails when the required pr-url argument is missing", async () => {
      const result = await runCli([]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("missing required argument");
    });

    it("fails for an unknown subcommand", async () => {
      const result = await runCli(["not-a-real-command"]);

      expect(result.exitCode).not.toBe(0);
    });

    it("fails for an unknown option", async () => {
      const result = await runCli(["--definitely-not-an-option"]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("unknown option");
    });

    it("fails when the resolve subcommand is missing pr-url", async () => {
      const result = await runCli(["resolve"]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("missing required argument");
    });

    it("fails when the delete subcommand is missing pr-url", async () => {
      const result = await runCli(["delete"]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("missing required argument");
    });
  });

  describe("PR URL validation", () => {
    it("rejects an invalid PR URL on the main command", async () => {
      const result = await runCli(["not-a-valid-url"], { env: fakeTokenEnv });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid GitHub PR URL format");
    });

    it("rejects a non-GitHub PR URL", async () => {
      const result = await runCli(["https://gitlab.com/owner/repo/pull/123"], {
        env: fakeTokenEnv,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid GitHub PR URL format");
    });

    it("rejects an invalid PR URL on the resolve subcommand", async () => {
      const result = await runCli(["resolve", "not-a-valid-url"], { env: fakeTokenEnv });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid GitHub PR URL format");
    });

    it("rejects an invalid PR URL on the delete subcommand", async () => {
      const result = await runCli(["delete", "not-a-valid-url"], { env: fakeTokenEnv });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid GitHub PR URL format");
    });

    it("rejects an empty PR URL", async () => {
      const result = await runCli([""], { env: fakeTokenEnv });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid GitHub PR URL format");
    });

    it("rejects a GitHub URL without a pull request path", async () => {
      const result = await runCli(["https://github.com/owner/repo"], { env: fakeTokenEnv });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid GitHub PR URL format");
    });

    it("rejects a GitHub URL with a non-numeric PR number", async () => {
      const result = await runCli(["https://github.com/owner/repo/pull/abc"], {
        env: fakeTokenEnv,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid GitHub PR URL format");
    });
  });

  describe("authentication", () => {
    it("fails with a helpful message when no token is available", async () => {
      const result = await runCli(["https://github.com/owner/repo/pull/1"], { env: noAuthEnv });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("GitHub authentication required");
    });

    it("fails the resolve subcommand when no token is available", async () => {
      const result = await runCli(["resolve", "https://github.com/owner/repo/pull/1"], {
        env: noAuthEnv,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("GitHub authentication required");
    });

    it("fails the delete subcommand when no token is available", async () => {
      const result = await runCli(["delete", "https://github.com/owner/repo/pull/1"], {
        env: noAuthEnv,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("GitHub authentication required");
    });
  });
});

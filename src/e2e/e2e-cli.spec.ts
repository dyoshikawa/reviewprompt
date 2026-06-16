import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

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

  describe("--version", () => {
    it("prints the package version", async () => {
      const result = await runCli(["--version"]);

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
  });

  describe("subcommand help", () => {
    it("prints help for the resolve subcommand", async () => {
      const result = await runCli(["resolve", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("resolve");
      expect(result.stdout).toContain("<pr-url>");
      expect(result.stdout).toContain("--mention");
    });

    it("prints help for the delete subcommand", async () => {
      const result = await runCli(["delete", "--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("delete");
      expect(result.stdout).toContain("<pr-url>");
      expect(result.stdout).toContain("--mention");
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
  });
});

import { execFile } from "node:child_process";
import { join, sep } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

// Get the command to run from environment variable
// Default to using tsx directly with the CLI entry point
const originalCwd = process.cwd();
const tsxPath = join(originalCwd, "node_modules", ".bin", "tsx");
const cliPath = join(originalCwd, "src", "cli", "index.ts");

// Validate process.env.REVIEWPROMPT_CMD
if (process.env.REVIEWPROMPT_CMD) {
  const resolvedReviewpromptCmd = join(originalCwd, process.env.REVIEWPROMPT_CMD);
  const splittedResolvedReviewpromptCmd = resolvedReviewpromptCmd.split(sep);
  const valid =
    splittedResolvedReviewpromptCmd.at(-2) === "dist-bun" &&
    splittedResolvedReviewpromptCmd.at(-1)?.startsWith("reviewprompt-");
  if (!valid) {
    throw new Error(
      `Invalid REVIEWPROMPT_CMD: must start with 'dist-bun' directory and end with 'reviewprompt-<platform>-<arch>': ${process.env.REVIEWPROMPT_CMD}`,
    );
  }
}

// Convert relative path to absolute path if REVIEWPROMPT_CMD is set
const reviewpromptCmd = process.env.REVIEWPROMPT_CMD
  ? join(originalCwd, process.env.REVIEWPROMPT_CMD)
  : tsxPath;
const reviewpromptArgs = process.env.REVIEWPROMPT_CMD ? [] : [cliPath];

describe("E2E Tests", () => {
  it("should display version with --version", async () => {
    const { stdout } = await execFileAsync(reviewpromptCmd, [...reviewpromptArgs, "--version"]);

    const versionMatch = stdout.trim().match(/(\d+\.\d+\.\d+)/);
    expect(versionMatch).toBeTruthy();
    expect(versionMatch?.[1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should display help with --help", async () => {
    const { stdout } = await execFileAsync(reviewpromptCmd, [...reviewpromptArgs, "--help"]);

    expect(stdout).toContain("GitHub PR review comments to AI prompt CLI tool");
    expect(stdout).toContain("Commands:");
  });

  it("should display error for missing PR URL", async () => {
    await expect(execFileAsync(reviewpromptCmd, reviewpromptArgs)).rejects.toThrow();
  });
});

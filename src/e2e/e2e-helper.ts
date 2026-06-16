import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Absolute path to the project root (two levels up from `src/e2e`).
 */
export const projectRoot = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface RunCliOptions {
  /**
   * Environment variables to merge on top of `process.env`.
   * Pass `undefined` as a value to remove an inherited variable.
   */
  env?: Record<string, string | undefined>;
}

/**
 * Resolve how the CLI under test should be invoked.
 *
 * By default the TypeScript entry point is executed through `tsx`, which keeps
 * the tests runnable without a build step. CI (or a packaged binary run) can set
 * `REVIEWPROMPT_CMD` to a full command (e.g. `node dist/index.js`) to exercise
 * the compiled artifact instead.
 */
function resolveCommand(): { bin: string; baseArgs: string[] } {
  const override = process.env.REVIEWPROMPT_CMD?.trim();
  if (override) {
    const [bin, ...baseArgs] = override.split(/\s+/);
    return { bin: bin ?? "", baseArgs };
  }

  const tsxBinName = process.platform === "win32" ? "tsx.cmd" : "tsx";
  const tsxBin = path.join(projectRoot, "node_modules", ".bin", tsxBinName);
  const cliEntry = path.join(projectRoot, "src", "cli", "index.ts");
  return { bin: tsxBin, baseArgs: [cliEntry] };
}

/**
 * Spawn the reviewprompt CLI as a real child process and capture its output.
 *
 * Unlike unit tests, this exercises the full Commander.js wiring end-to-end:
 * argument parsing, version/help output, validation and exit codes.
 */
export async function runCli(args: string[], options: RunCliOptions = {}): Promise<CliResult> {
  const { bin, baseArgs } = resolveCommand();

  const env: NodeJS.ProcessEnv = { ...process.env };
  if (options.env) {
    for (const [key, value] of Object.entries(options.env)) {
      if (value === undefined) {
        delete env[key];
      } else {
        env[key] = value;
      }
    }
  }

  try {
    const { stdout, stderr } = await execFileAsync(bin, [...baseArgs, ...args], {
      cwd: projectRoot,
      env,
      timeout: 30_000,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: typeof err.stdout === "string" ? err.stdout : "",
      stderr: typeof err.stderr === "string" ? err.stderr : "",
      exitCode: typeof err.code === "number" ? err.code : 1,
    };
  }
}

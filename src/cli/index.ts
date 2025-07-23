#!/usr/bin/env node

import { Command } from "commander";
import { executeDeleteCommand } from "./commands/delete.js";
import { executeMainCommand } from "./commands/main.js";
import { executeResolveCommand } from "./commands/resolve.js";

const program = new Command();

program
  .name("reviewprompt")
  .description("GitHub PR review comments to AI prompt CLI tool")
  .version("0.1.0");

program
  .argument("<pr-url>", "GitHub PR URL")
  .option("-i, --interactive", "run in interactive mode")
  .option("-r, --resolve", "resolve comments after building prompt")
  .option("-d, --delete", "delete comments after building prompt")
  .option("-m, --mention <mention>", "custom mention to filter (default: @ai)", "@ai")
  .option("-c, --clipboard", "copy output to clipboard")
  .action(async (prUrl: string, options) => {
    await executeMainCommand(prUrl, options);
  });

program
  .command("resolve")
  .description("resolve comments containing the specified mention")
  .argument("<pr-url>", "GitHub PR URL")
  .option("-a, --all", "resolve all comments without interactive mode")
  .option("-m, --mention <mention>", "custom mention to filter (default: @ai)", "@ai")
  .action(async (prUrl: string, options) => {
    await executeResolveCommand(prUrl, options);
  });

program
  .command("delete")
  .description("delete comments containing the specified mention")
  .argument("<pr-url>", "GitHub PR URL")
  .option("-a, --all", "delete all comments without interactive mode")
  .option("-m, --mention <mention>", "custom mention to filter (default: @ai)", "@ai")
  .action(async (prUrl: string, options) => {
    await executeDeleteCommand(prUrl, options);
  });

program.parse();

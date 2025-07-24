import { showCommentSelector } from "../../components/CommentSelector.js";
import { filterCommentsByMention } from "../../lib/comment.js";
import { GitHubClient } from "../../lib/github.js";
import type { CliOptions, PRInfo } from "../../lib/types.js";
import { copyToClipboard } from "../../utils/clipboard.js";
import { buildPrompt, displayPrompt } from "../../utils/prompt.js";

export async function executeMainCommand(prUrl: string, options: CliOptions): Promise<void> {
  try {
    const client = new GitHubClient();
    const prInfo: PRInfo = client.parsePRUrl(prUrl);

    const comments = await client.getReviewComments(prInfo);
    const mention = options.mention || "[ai]";
    const filteredComments = filterCommentsByMention(comments, mention);

    if (filteredComments.length === 0) {
      console.log(`No comments found with mention "${mention}"`);
      return;
    }

    let selectedComments = filteredComments;

    if (options.interactive) {
      selectedComments = await showCommentSelector(
        filteredComments,
        `Select comments with "${mention}" to include in prompt:`,
      );

      if (selectedComments.length === 0) {
        console.log("No comments selected.");
        return;
      }
    }

    const prompt = buildPrompt(selectedComments);

    if (options.clipboard) {
      await copyToClipboard(prompt);
      console.log(`Copied ${selectedComments.length} comment(s) to clipboard.`);
    } else {
      displayPrompt(prompt);
    }

    if (options.resolve) {
      for (const comment of selectedComments) {
        await client.resolveComment(prInfo, comment.id);
      }
      console.log(`Resolved ${selectedComments.length} comment(s).`);
    } else if (options.delete) {
      for (const comment of selectedComments) {
        await client.deleteComment(prInfo, comment.id);
      }
      console.log(`Deleted ${selectedComments.length} comment(s).`);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

import { showCommentSelector } from "../../components/CommentSelector.js";
import { GitHubClient } from "../../lib/github.js";
import type { CliOptions } from "../../lib/types.js";
import { collectMentionedComments } from "./collect-comments.js";

export async function executeDeleteCommand(prUrl: string, options: CliOptions): Promise<void> {
  try {
    const client = new GitHubClient();
    const prInfo = client.parsePRUrl(prUrl);

    const mention = options.mention || "[ai]";
    const filteredComments = await collectMentionedComments(client, prInfo, mention, options);

    if (filteredComments.length === 0) {
      console.log(`No comments found with mention "${mention}"`);
      return;
    }

    let selectedComments = filteredComments;

    if (!options.all) {
      selectedComments = await showCommentSelector(
        filteredComments,
        `Select comments with "${mention}" to delete:`,
      );

      if (selectedComments.length === 0) {
        console.log("No comments selected.");
        return;
      }
    }

    for (const comment of selectedComments) {
      await client.deleteComment(prInfo, comment.id);
    }

    console.log(`Deleted ${selectedComments.length} comment(s).`);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

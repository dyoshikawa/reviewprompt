import { showCommentSelector } from "../../components/CommentSelector.js";
import { filterCommentsByMention } from "../../lib/comment.js";
import { GitHubClient } from "../../lib/github.js";
import type { CliOptions } from "../../lib/types.js";

export async function executeResolveCommand(prUrl: string, options: CliOptions): Promise<void> {
  try {
    const client = new GitHubClient();
    const prInfo = client.parsePRUrl(prUrl);

    const comments = await client.getReviewComments(prInfo);
    const mention = options.mention || "[ai]";
    const filteredComments = filterCommentsByMention(comments, mention);

    if (filteredComments.length === 0) {
      console.log(`No comments found with mention "${mention}"`);
      return;
    }

    let selectedComments = filteredComments;

    if (!options.all) {
      selectedComments = await showCommentSelector(
        filteredComments,
        `Select comments with "${mention}" to resolve:`,
      );

      if (selectedComments.length === 0) {
        console.log("No comments selected.");
        return;
      }
    }

    for (const comment of selectedComments) {
      await client.resolveComment(prInfo, comment.id);
    }

    console.log(`Resolved ${selectedComments.length} comment(s).`);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

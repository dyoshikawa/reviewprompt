import { filterCommentsByMention, partitionCommentsByTrust } from "../../lib/comment.js";
import type { GitHubClient } from "../../lib/github.js";
import type { CliOptions, FilteredComment, PRInfo } from "../../lib/types.js";

/**
 * Fetch the unresolved review comments carrying the mention and, unless the caller opted in
 * with `includeUntrustedAuthors`, drop the ones written by authors without write access to the
 * repository (or other than the authenticated user). On public repositories anyone can post a
 * review comment, so those comments must not become prompt input or be resolved/deleted by
 * `--all` without an explicit opt-in.
 */
export async function collectMentionedComments(
  client: GitHubClient,
  prInfo: PRInfo,
  mention: string,
  options: Pick<CliOptions, "includeUntrustedAuthors">,
): Promise<FilteredComment[]> {
  const comments = await client.getReviewComments(prInfo);
  const filteredComments = filterCommentsByMention(comments, mention);

  if (options.includeUntrustedAuthors || filteredComments.length === 0) {
    return filteredComments;
  }

  const viewerLogin = await client.getViewerLogin();
  const { trusted, untrusted } = partitionCommentsByTrust(filteredComments, viewerLogin);

  if (untrusted.length > 0) {
    const authors = [...new Set(untrusted.map((comment) => `@${comment.user}`))].join(", ");
    console.error(
      `Skipped ${untrusted.length} comment(s) from authors without write access (${authors}). ` +
        "Pass --include-untrusted-authors to include them.",
    );
  }

  return trusted;
}

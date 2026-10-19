import { filterCommentsByMention, partitionCommentsByTrust } from "../../lib/comment.js";
import type { GitHubClient } from "../../lib/github.js";
import type { CliOptions, FilteredComment, PRInfo } from "../../lib/types.js";

export const INCLUDE_UNTRUSTED_AUTHORS_FLAG = "--include-untrusted-authors";
export const INCLUDE_UNTRUSTED_AUTHORS_DESCRIPTION =
  "also include comments from authors other than the repository owner, organization members, collaborators and yourself";

export interface CollectedComments {
  comments: FilteredComment[];
  skippedCount: number;
}

/**
 * Fetch the unresolved review comments carrying the mention and, unless the caller opted in
 * with `includeUntrustedAuthors`, drop the ones whose author association is not
 * OWNER/MEMBER/COLLABORATOR and who is not the authenticated user. On public repositories anyone
 * can post a review comment, so those comments must not become prompt input or be
 * resolved/deleted by `--all` without an explicit opt-in.
 */
export async function collectMentionedComments(
  client: GitHubClient,
  prInfo: PRInfo,
  mention: string,
  options: Pick<CliOptions, "includeUntrustedAuthors">,
): Promise<CollectedComments> {
  const comments = await client.getReviewComments(prInfo);
  const filteredComments = filterCommentsByMention(comments, mention);

  if (options.includeUntrustedAuthors || filteredComments.length === 0) {
    return { comments: filteredComments, skippedCount: 0 };
  }

  const viewerLogin = await client.getViewerLogin();
  const { trusted, untrusted } = partitionCommentsByTrust(filteredComments, viewerLogin);

  if (untrusted.length > 0) {
    const authors = [...new Set(untrusted.map((comment) => `@${comment.user}`))].join(", ");
    console.error(
      `Skipped ${untrusted.length} comment(s) from untrusted authors ` +
        `(not OWNER/MEMBER/COLLABORATOR): ${authors}. ` +
        `Pass ${INCLUDE_UNTRUSTED_AUTHORS_FLAG} to include them.`,
    );
  }

  return { comments: trusted, skippedCount: untrusted.length };
}

export function noCommentsMessage(mention: string, skippedCount: number): string {
  return skippedCount > 0
    ? `No trusted comments found with mention "${mention}" (${skippedCount} skipped)`
    : `No comments found with mention "${mention}"`;
}

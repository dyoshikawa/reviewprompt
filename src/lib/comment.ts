import type { FilteredComment, PRComment } from "./types.js";

export function filterCommentsByMention(
  comments: PRComment[],
  mention: string = "[ai]",
): FilteredComment[] {
  return comments
    .filter((comment) => comment.body.includes(mention))
    .filter((comment) => !comment.isResolved) // Exclude resolved comments
    .map((comment) => ({
      id: comment.id,
      body: comment.body,
      path: comment.path,
      line: comment.line,
      startLine: comment.startLine,
      user: comment.user.login,
      authorAssociation: comment.authorAssociation,
      htmlUrl: comment.htmlUrl,
      position: comment.position,
      originalPosition: comment.originalPosition,
      diffHunk: comment.diffHunk,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isResolved: comment.isResolved || false,
    }));
}

/**
 * Author associations that have write access to the repository. Comments from anyone else
 * (CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR, NONE, ...) can be posted by any GitHub user on a public
 * repository, so they are not trusted as prompt input by default.
 */
export const TRUSTED_AUTHOR_ASSOCIATIONS: ReadonlySet<string> = new Set([
  "OWNER",
  "MEMBER",
  "COLLABORATOR",
]);

export function isTrustedComment(comment: FilteredComment, viewerLogin?: string): boolean {
  if (viewerLogin !== undefined && comment.user.toLowerCase() === viewerLogin.toLowerCase()) {
    return true;
  }
  return (
    comment.authorAssociation !== undefined &&
    TRUSTED_AUTHOR_ASSOCIATIONS.has(comment.authorAssociation)
  );
}

export function partitionCommentsByTrust(
  comments: FilteredComment[],
  viewerLogin?: string,
): { trusted: FilteredComment[]; untrusted: FilteredComment[] } {
  const trusted: FilteredComment[] = [];
  const untrusted: FilteredComment[] = [];
  for (const comment of comments) {
    (isTrustedComment(comment, viewerLogin) ? trusted : untrusted).push(comment);
  }
  return { trusted, untrusted };
}

// C0 controls except tab and newline, DEL, C1 controls, and Unicode bidi overrides/isolates.
// These can rewrite or hide terminal output (ANSI escape sequences) or reorder displayed text.
// oxlint-disable-next-line no-control-regex
const UNSAFE_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g;

export function stripControlCharacters(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(UNSAFE_CHARACTERS, "");
}

export function cleanCommentBody(body: string, mention: string = "[ai]"): string {
  // Escape special regex characters in the mention string
  const escapedMention = mention.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return stripControlCharacters(body)
    .replace(new RegExp(escapedMention, "g"), "")
    .trim()
    .replace(/^\s*\n+/, "")
    .replace(/\n+\s*$/, "");
}

export function formatCommentForPrompt(comment: FilteredComment): string {
  const cleanBody = cleanCommentBody(comment.body);

  if (comment.path && (comment.line || comment.startLine)) {
    const lineInfo =
      comment.startLine && comment.line && comment.startLine !== comment.line
        ? `L${comment.startLine}-L${comment.line}`
        : `L${comment.line || comment.startLine}`;

    return `./${stripControlCharacters(comment.path)}:${lineInfo}\n${cleanBody}`;
  }

  return `${cleanBody}`;
}

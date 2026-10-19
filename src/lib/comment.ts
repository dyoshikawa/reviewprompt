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
 * Author associations trusted as prompt input by default: the repository owner, members of the
 * owning organization, and invited collaborators. This is GitHub's `authorAssociation`, not a
 * permission check: MEMBER does not guarantee any access to this particular repository, and a
 * maintainer whose organization membership is private may show up as CONTRIBUTOR or NONE.
 * Anyone else (CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR, NONE, ...) can be any GitHub user on a public
 * repository, so their comments are excluded unless the caller opts in.
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

// C0 controls except tab and newline, DEL, C1 controls, bidi marks/overrides/isolates,
// zero-width characters, the BOM, and Unicode tag characters. These can rewrite terminal output
// (ANSI escape sequences), reorder displayed text, or hide text from a human reader while an AI
// model still reads it.
const UNSAFE_CHARACTERS =
  // oxlint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u061C\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/gu;

export function stripControlCharacters(text: string): string {
  return text.replace(/\r\n?|[\u2028\u2029]/g, "\n").replace(UNSAFE_CHARACTERS, "");
}

/**
 * Single-line variant for values that must not span lines, such as file paths (a git path can
 * contain newlines, and the PR author chooses it).
 */
export function sanitizeSingleLine(text: string): string {
  return stripControlCharacters(text).replace(/[\n\t]+/g, " ");
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

    return `./${sanitizeSingleLine(comment.path)}:${lineInfo}\n${cleanBody}`;
  }

  return `${cleanBody}`;
}

import type { FilteredComment, PRComment } from "./types.js";

export const DEFAULT_MENTION = "[ai]";

export function filterCommentsByMention(
  comments: PRComment[],
  mention: string = DEFAULT_MENTION,
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

// Control characters except tab and newline (Cc: C0, DEL, C1), format characters (Cf: bidi
// marks/overrides/isolates, zero-width characters, the BOM, soft hyphen, Unicode tag characters,
// ...), variation selectors, and invisible fillers. These can rewrite terminal output (ANSI escape
// sequences), reorder displayed text, or hide text from a human reader while an AI model still
// reads it (tag-character and variation-selector smuggling). Private-use characters (Co) render
// as nothing or as an arbitrary glyph, so they are dropped as well.
const UNSAFE_CHARACTERS =
  /(?![\t\n])\p{Cc}|\p{Cf}|\u034F|[\u115F\u1160\u180B-\u180F\u2800\u3164\uFFA0]|\p{Co}|[\uFE00-\uFE0F]|[\u{E0100}-\u{E01EF}]/gu;

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

export function cleanCommentBody(body: string, mention: string = DEFAULT_MENTION): string {
  // Escape special regex characters in the mention string
  const escapedMention = mention.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return stripControlCharacters(body)
    .replace(new RegExp(escapedMention, "g"), "")
    .trim()
    .replace(/^\s*\n+/, "")
    .replace(/\n+\s*$/, "");
}

// buildPrompt joins sections with a "=====" line; escape such lines in a body so one comment
// cannot fake the start of another section.
function escapeSectionSeparators(body: string): string {
  // `[^\S\n]` is any whitespace except newline (including U+00A0 and U+3000): plain `\s` would
  // also match newlines and anchor on a blank line above. Fullwidth "\uFF1D" is included because a
  // model may read it as the same separator.
  return body.replace(/^([^\S\n]*[=\uFF1D]{5,}[^\S\n]*)$/gm, "\\$1");
}

export function formatCommentForPrompt(
  comment: FilteredComment,
  mention: string = DEFAULT_MENTION,
): string {
  const cleanBody = escapeSectionSeparators(cleanCommentBody(comment.body, mention));

  if (comment.path && (comment.line || comment.startLine)) {
    const lineInfo =
      comment.startLine && comment.line && comment.startLine !== comment.line
        ? `L${comment.startLine}-L${comment.line}`
        : `L${comment.line || comment.startLine}`;

    return `./${sanitizeSingleLine(comment.path)}:${lineInfo}\n${cleanBody}`;
  }

  return `${cleanBody}`;
}

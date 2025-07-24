import type { FilteredComment, PRComment } from "./types.js";

export function filterCommentsByMention(
  comments: PRComment[],
  mention: string = "@ai",
): FilteredComment[] {
  return comments
    .filter((comment) => comment.body.includes(mention))
    .map((comment) => ({
      id: comment.id,
      body: comment.body,
      path: comment.path,
      line: comment.line,
      startLine: comment.startLine,
      user: comment.user.login,
      htmlUrl: comment.htmlUrl,
      position: comment.position,
      originalPosition: comment.originalPosition,
      diffHunk: comment.diffHunk,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));
}

export function cleanCommentBody(body: string, mention: string = "@ai"): string {
  return body
    .replace(new RegExp(mention, "g"), "")
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

    return `./${comment.path}:${lineInfo}\n${cleanBody}`;
  }

  return `${cleanBody}`;
}

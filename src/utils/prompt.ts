import { formatCommentForPrompt } from "../lib/comment.js";
import type { FilteredComment, PromptSection } from "../lib/types.js";

export function buildPrompt(comments: FilteredComment[]): string {
  if (comments.length === 0) {
    return "";
  }

  const sections: PromptSection[] = comments.map((comment) => ({
    comment,
    content: formatCommentForPrompt(comment),
  }));

  return sections.map((section) => section.content).join("\n# =====\n");
}

export function displayPrompt(prompt: string): void {
  if (prompt.trim()) {
    console.log(prompt);
  } else {
    console.log("No comments found with the specified mention.");
  }
}

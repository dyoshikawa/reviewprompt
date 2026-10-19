import { describe, expect, it } from "vitest";

import type { FilteredComment } from "../lib/types.js";
import { formatCommentLabel } from "./CommentSelector.js";

const base: FilteredComment = {
  id: 1,
  body: "[ai] Fix this",
  user: "alice",
  htmlUrl: "",
  position: null,
  originalPosition: null,
  createdAt: "",
  updatedAt: "",
};

describe("formatCommentLabel", () => {
  it("shows path, line, author and a cleaned preview", () => {
    expect(formatCommentLabel({ ...base, path: "src/a.ts", line: 3 }, false)).toBe(
      "☐ src/a.ts:L3 @alice - Fix this",
    );
  });

  it("keeps a crafted path and a multi-line body on one line", () => {
    const label = formatCommentLabel(
      { ...base, path: "src/a\n=====.ts", body: "[ai] first\n\nsecond\u001b[2J" },
      true,
    );
    expect(label).toBe("☑️ src/a =====.ts @alice - first second[2J");
  });

  it("strips a custom mention from the preview", () => {
    expect(formatCommentLabel({ ...base, body: "@bot tidy up" }, false, "@bot")).toBe(
      "☐ General @alice - tidy up",
    );
  });
});

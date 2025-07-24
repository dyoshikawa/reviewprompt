import { Box, render, Text } from "ink";
import SelectInput from "ink-select-input";
import React, { useState } from "react";
import type { FilteredComment } from "../lib/types.js";

type JSXElement = React.ReactElement;

interface CommentSelectorProps {
  comments: FilteredComment[];
  onSelect: (selectedComments: FilteredComment[]) => void;
  title?: string | undefined;
}

interface SelectItem {
  label: string;
  value: string;
}

export function CommentSelector({ comments, onSelect, title }: CommentSelectorProps): JSXElement {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const items: SelectItem[] = [
    ...comments.map((comment) => ({
      label: formatCommentLabel(comment, selectedIds.has(comment.id)),
      value: comment.id.toString(),
    })),
    {
      label: "✅ Done - Process selected comments",
      value: "done",
    },
  ];

  const handleSelect = (item: SelectItem) => {
    if (item.value === "done") {
      const selectedComments = comments.filter((comment) => selectedIds.has(comment.id));
      onSelect(selectedComments);
      return;
    }

    const commentId = parseInt(item.value, 10);
    const newSelectedIds = new Set(selectedIds);

    if (newSelectedIds.has(commentId)) {
      newSelectedIds.delete(commentId);
    } else {
      newSelectedIds.add(commentId);
    }

    setSelectedIds(newSelectedIds);
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {title || "Select comments:"}
      </Text>
      <Text color="gray">
        Use arrow keys to navigate, Enter to toggle selection, select "Done" when finished
      </Text>
      <Text color="yellow">Selected: {selectedIds.size} comment(s)</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
    </Box>
  );
}

function formatCommentLabel(comment: FilteredComment, isSelected: boolean): string {
  const prefix = isSelected ? "☑️ " : "☐ ";
  const path = comment.path ? `${comment.path}` : "General";
  const line = comment.line || comment.startLine ? `:L${comment.line || comment.startLine}` : "";
  const preview = comment.body
    .replace(/\[ai\]/g, "")
    .trim()
    .substring(0, 50);
  const truncated = preview.length === 50 ? "..." : "";

  return `${prefix}${path}${line} - ${preview}${truncated}`;
}

export async function showCommentSelector(
  comments: FilteredComment[],
  title?: string,
): Promise<FilteredComment[]> {
  return new Promise((resolve) => {
    const { unmount } = render(
      <CommentSelector
        comments={comments}
        onSelect={(selected) => {
          unmount();
          resolve(selected);
        }}
        title={title}
      />,
    );
  });
}

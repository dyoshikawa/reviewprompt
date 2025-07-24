import { Box, render, Text, useInput } from "ink";
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
  const [currentIndex, setCurrentIndex] = useState(0);

  const items: SelectItem[] = comments.map((comment) => ({
    label: formatCommentLabel(comment, selectedIds.has(comment.id)),
    value: comment.id.toString(),
  }));

  useInput((input, key) => {
    if (input === " ") {
      // Toggle selection with space key
      const commentId = parseInt(items[currentIndex]?.value || "0", 10);
      const newSelectedIds = new Set(selectedIds);

      if (newSelectedIds.has(commentId)) {
        newSelectedIds.delete(commentId);
      } else {
        newSelectedIds.add(commentId);
      }

      setSelectedIds(newSelectedIds);
    } else if (key.return) {
      // Submit with enter key
      const selectedComments = comments.filter((comment) => selectedIds.has(comment.id));
      onSelect(selectedComments);
    }
  });

  const handleSelect = (item: SelectItem) => {
    // Update current index when navigating
    const index = items.findIndex((i) => i.value === item.value);
    setCurrentIndex(index);
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {title || "Select comments:"}
      </Text>
      <Text color="gray">
        Use arrow keys to navigate, space to toggle selection, enter to submit
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

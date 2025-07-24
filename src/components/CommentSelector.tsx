import { Box, render, Text } from "ink";
import MultiSelect from "ink-multi-select";
import React from "react";
import type { FilteredComment } from "../lib/types.js";

// Type assertion for ink-multi-select compatibility
const MultiSelectComponent = MultiSelect as unknown as React.ComponentType<{
  items: SelectItem[];
  onSubmit: (items: SelectItem[]) => void;
}>;

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
  const items: SelectItem[] = comments.map((comment) => ({
    label: formatCommentLabel(comment),
    value: comment.id.toString(),
  }));

  const handleSubmit = (selectedItems: SelectItem[]) => {
    const selectedCommentIds = selectedItems.map((item) => parseInt(item.value, 10));
    const selectedComments = comments.filter((comment) => selectedCommentIds.includes(comment.id));
    onSelect(selectedComments);
  };

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {title || "Select comments:"}
      </Text>
      <Text color="gray">
        Use arrow keys to navigate, space to toggle selection, enter to submit
      </Text>
      <Box marginTop={1}>
        <MultiSelectComponent items={items} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}

function formatCommentLabel(comment: FilteredComment): string {
  const path = comment.path ? `${comment.path}` : "General";
  const line = comment.line || comment.startLine ? `:L${comment.line || comment.startLine}` : "";
  const preview = comment.body
    .replace(/\[ai\]/g, "")
    .trim()
    .substring(0, 50);
  const truncated = preview.length === 50 ? "..." : "";

  return `${path}${line} - ${preview}${truncated}`;
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

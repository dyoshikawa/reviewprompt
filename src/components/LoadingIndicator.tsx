import { Box, render, Text } from "ink";
import React, { useEffect, useState } from "react";

type JSXElement = React.ReactElement;

interface LoadingIndicatorProps {
  message?: string;
  total?: number | undefined;
  current?: number | undefined;
}

export function LoadingIndicator({
  message = "Loading",
  total,
  current,
}: LoadingIndicatorProps): JSXElement {
  const [frame, setFrame] = useState(0);

  const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % spinner.length);
    }, 80);

    return () => clearInterval(interval);
  }, [spinner.length]);

  const progressText = total && current !== undefined ? ` (${current}/${total})` : "";

  return (
    <Box>
      <Text color="cyan">
        {spinner[frame]} {message}
        {progressText}...
      </Text>
    </Box>
  );
}

export interface LoadingSpinnerControls {
  update: (current?: number, message?: string) => void;
  stop: () => void;
}

export function showLoadingIndicator(message?: string, total?: number): LoadingSpinnerControls {
  let currentValue = 0;
  let currentMessage = message || "Loading";
  let isStopped = false;

  const { rerender, unmount } = render(
    <LoadingIndicator
      message={currentMessage}
      total={total}
      current={total ? currentValue : undefined}
    />,
  );

  const controls: LoadingSpinnerControls = {
    update: (current?: number, newMessage?: string) => {
      if (isStopped) return;

      if (current !== undefined) {
        currentValue = current;
      }
      if (newMessage !== undefined) {
        currentMessage = newMessage;
      }

      rerender(
        <LoadingIndicator
          message={currentMessage}
          total={total}
          current={total ? currentValue : undefined}
        />,
      );
    },
    stop: () => {
      if (!isStopped) {
        isStopped = true;
        unmount();
      }
    },
  };

  return controls;
}

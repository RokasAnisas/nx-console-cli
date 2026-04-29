import React from "react";
import { Box, Text } from "ink";

const SHORTCUTS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "↑↓", label: "navigate" },
  { key: "⇧↑↓", label: "skip" },
  { key: "←→", label: "expand" },
  { key: "↵", label: "run" },
  { key: "⇥", label: "switch tab" },
  { key: "⇧→", label: "favourite" },
  { key: "type", label: "filter" },
  { key: "esc", label: "clear" },
  { key: "^C", label: "quit" },
];

const COMPACT: ReadonlyArray<{ key: string; label: string }> = [
  { key: "↑↓", label: "nav" },
  { key: "↵", label: "run" },
  { key: "⇥", label: "tab" },
  { key: "⇧→", label: "★" },
  { key: "esc", label: "clear" },
  { key: "^C", label: "quit" },
];

interface Props {
  terminalWidth: number;
}

export function Shortcuts({ terminalWidth }: Props) {
  const items = terminalWidth < 100 ? COMPACT : SHORTCUTS;
  return (
    <Box flexWrap="wrap">
      {items.map((s, i) => (
        <Box key={s.key}>
          {i > 0 && (
            <Text color="gray" dimColor>
              {"   "}
            </Text>
          )}
          <Text color="white" bold>
            {s.key}
          </Text>
          <Text color="gray" dimColor>
            {" "}
            {s.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

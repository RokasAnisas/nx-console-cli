import React from "react";
import { Box, Text } from "ink";

const SHORTCUTS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "↑↓", label: "navigate" },
  { key: "←→", label: "expand" },
  { key: "Enter", label: "run" },
  { key: "Tab", label: "tree/flat/★" },
  { key: "⇧→", label: "favourite" },
  { key: "type", label: "filter" },
  { key: "Esc", label: "clear" },
  { key: "^C", label: "quit" },
];

const COMPACT: ReadonlyArray<{ key: string; label: string }> = [
  { key: "↑↓", label: "nav" },
  { key: "↵", label: "run" },
  { key: "⇥", label: "mode" },
  { key: "⇧→", label: "★" },
  { key: "esc", label: "clear" },
  { key: "^C", label: "quit" },
];

interface Props {
  terminalWidth: number;
}

export function Shortcuts({ terminalWidth }: Props) {
  const items = terminalWidth < 80 ? COMPACT : SHORTCUTS;
  return (
    <Box flexWrap="wrap">
      {items.map((s) => (
        <Box key={s.key} marginRight={2}>
          <Text color="cyan" bold>
            {s.key}
          </Text>
          <Text color="gray"> {s.label}</Text>
        </Box>
      ))}
    </Box>
  );
}

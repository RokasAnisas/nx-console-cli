import React from "react";
import { Box, Text } from "ink";

import type { DashMode } from "./useDashState.js";

interface Tab {
  mode: DashMode;
  label: string;
  color: string;
}

const TABS: ReadonlyArray<Tab> = [
  { mode: "tree", label: "tree", color: "cyan" },
  { mode: "flat", label: "flat", color: "blue" },
  { mode: "favourites", label: "★ favourite", color: "yellow" },
  { mode: "modified", label: "● modified", color: "cyanBright" },
  { mode: "recent", label: "↻ recent", color: "green" },
];

const PAD = 2;

interface Props {
  mode: DashMode;
  searching: boolean;
}

export function TabBar({ mode, searching }: Props) {
  return (
    <Box flexDirection="column">
      <Box>
        {TABS.map((tab) => {
          const isActive = tab.mode === mode;
          const pad = " ".repeat(PAD);
          if (isActive) {
            return (
              <Text key={tab.mode}>
                {pad}
                <Text bold color={tab.color} dimColor={searching}>
                  {tab.label}
                </Text>
                {pad}
              </Text>
            );
          }
          return (
            <Text key={tab.mode} color="gray" dimColor>
              {pad}
              {tab.label}
              {pad}
            </Text>
          );
        })}
      </Box>
      <Box>
        {TABS.map((tab) => {
          const isActive = tab.mode === mode;
          const width = tab.label.length + PAD * 2;
          if (isActive) {
            return (
              <Text key={tab.mode} color={tab.color} dimColor={searching}>
                {"━".repeat(width)}
              </Text>
            );
          }
          return (
            <Text key={tab.mode} color="gray" dimColor>
              {"─".repeat(width)}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}

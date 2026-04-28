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
  { mode: "favourites", label: "★ favorite", color: "yellow" },
  { mode: "modified", label: "● modified", color: "cyanBright" },
];

interface Props {
  mode: DashMode;
  searching: boolean;
}

export function TabBar({ mode, searching }: Props) {
  return (
    <Box>
      {TABS.map((tab, i) => {
        const isActive = tab.mode === mode;
        return (
          <React.Fragment key={tab.mode}>
            {i > 0 && (
              <Text color="gray" dimColor>
                {"  "}
              </Text>
            )}
            {isActive ? (
              <Text color={tab.color} bold underline dimColor={searching}>
                {tab.label}
              </Text>
            ) : (
              <Text color="gray" dimColor>
                {tab.label}
              </Text>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}

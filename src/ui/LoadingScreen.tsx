import React from "react";
import { Box, Text } from "ink";

import { Logo } from "./Logo.js";
import { Shortcuts } from "./Shortcuts.js";
import { useSpinnerFrame } from "./useSpinnerFrame.js";
import type { LoadProgress } from "../workspace/loadProjects.js";

interface Props {
  version: string;
  workspaceRoot: string;
  terminalWidth: number;
  progress: LoadProgress | null;
}

export function LoadingScreen({ version, workspaceRoot, terminalWidth, progress }: Props) {
  const frame = useSpinnerFrame();
  return (
    <Box flexDirection="column">
      <Logo version={version} />
      <Box marginTop={1}>
        <Shortcuts terminalWidth={terminalWidth} />
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text color="cyan" bold>
            {frame}
          </Text>
          <Text> {describeProgress(progress)}</Text>
        </Box>
        <Text color="gray" dimColor>
          {workspaceRoot}
        </Text>
      </Box>
    </Box>
  );
}

function describeProgress(p: LoadProgress | null): string {
  if (!p) return "Scanning NX workspace…";
  switch (p.phase) {
    case "discovering":
      return "Discovering projects via nx show…";
    case "loading":
      return `Loading ${p.current} / ${p.total} projects…`;
    case "fallback":
      return "Falling back to project.json scan…";
  }
}

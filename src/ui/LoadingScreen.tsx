import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";

import { Logo } from "./Logo.js";
import { Shortcuts } from "./Shortcuts.js";
import type { LoadProgress } from "../workspace/loadProjects.js";

interface Props {
  version: string;
  workspaceRoot: string;
  terminalWidth: number;
  progress: LoadProgress | null;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
const SPINNER_INTERVAL_MS = 80;

export function LoadingScreen({ version, workspaceRoot, terminalWidth, progress }: Props) {
  const frame = useSpinnerFrame();
  return (
    <Box flexDirection="column">
      <Logo version={version} terminalWidth={terminalWidth} />
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

function useSpinnerFrame(): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setI((n) => (n + 1) % SPINNER_FRAMES.length);
    }, SPINNER_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  return SPINNER_FRAMES[i] ?? SPINNER_FRAMES[0];
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

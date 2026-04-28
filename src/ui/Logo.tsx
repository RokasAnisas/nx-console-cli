import React from "react";
import { Box, Text } from "ink";

const LOGO_LINES = [
  "███╗   ██╗██╗  ██╗      ██████╗  █████╗ ███████╗██╗  ██╗",
  "████╗  ██║╚██╗██╔╝      ██╔══██╗██╔══██╗██╔════╝██║  ██║",
  "██╔██╗ ██║ ╚███╔╝ █████╗██║  ██║███████║███████╗███████║",
  "██║╚██╗██║ ██╔██╗ ╚════╝██║  ██║██╔══██║╚════██║██╔══██║",
  "██║ ╚████║██╔╝ ██╗      ██████╔╝██║  ██║███████║██║  ██║",
  "╚═╝  ╚═══╝╚═╝  ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝",
] as const;

const LOGO_COLORS = ["cyan", "cyan", "cyanBright", "magentaBright", "magenta", "magenta"] as const;

const LOGO_WIDTH = LOGO_LINES[0].length;

interface Props {
  version: string;
  terminalWidth: number;
}

export function Logo({ version, terminalWidth }: Props) {
  if (terminalWidth < LOGO_WIDTH + 4) {
    return (
      <Box>
        <Text bold color="cyan">
          nx-dash
        </Text>
        <Text color="gray"> · </Text>
        <Text color="magenta">terminal nx console</Text>
        <Text color="gray"> · v{version}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {LOGO_LINES.map((line, i) => (
        <Text key={i} color={LOGO_COLORS[i]}>
          {line}
        </Text>
      ))}
      <Box>
        <Text color="gray">terminal nx console </Text>
        <Text color="gray" dimColor>
          ·{" "}
        </Text>
        <Text color="magentaBright">v{version}</Text>
      </Box>
    </Box>
  );
}

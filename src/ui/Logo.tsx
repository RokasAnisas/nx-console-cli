import React from "react";
import { Box, Text } from "ink";

interface Props {
  version: string;
}

export function Logo({ version }: Props) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">
          nx
        </Text>
        <Text bold color="magentaBright">
          -dash
        </Text>
      </Box>
      <Box>
        <Text color="gray">terminal nx console</Text>
        <Text color="gray" dimColor>
          {" "}
          ·{" "}
        </Text>
        <Text color="magentaBright">v{version}</Text>
      </Box>
    </Box>
  );
}

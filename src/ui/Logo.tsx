import React from "react";
import { Box, Text } from "ink";

interface Props {
  version: string;
}

export function Logo({ version }: Props) {
  return (
    <Box>
      <Text color="cyan" bold>
        {"▎"}
      </Text>
      <Text> </Text>
      <Text bold color="cyan">
        nx
      </Text>
      <Text bold color="magentaBright">
        ·dash
      </Text>
      <Text color="gray" dimColor>
        {"   "}
      </Text>
      <Text color="magentaBright" dimColor>
        v{version}
      </Text>
      <Text color="gray" dimColor>
        {"   ·   "}
      </Text>
      <Text color="gray" dimColor>
        terminal nx console
      </Text>
    </Box>
  );
}

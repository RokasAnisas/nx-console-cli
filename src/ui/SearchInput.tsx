import React from "react";
import { Box, Text } from "ink";

import type { DashMode } from "./useDashState.js";

interface Props {
  query: string;
  mode: DashMode | "search";
}

export function SearchInput({ query, mode }: Props) {
  const searching = mode === "search";
  return (
    <Box>
      <Text color={searching ? "magenta" : "gray"} bold={searching}>
        ›{" "}
      </Text>
      <Text>{query}</Text>
      <Text color="gray" inverse={query.length === 0}>
        {query.length === 0 ? " " : "_"}
      </Text>
      {query.length === 0 && <Text color="gray"> type to filter…</Text>}
    </Box>
  );
}

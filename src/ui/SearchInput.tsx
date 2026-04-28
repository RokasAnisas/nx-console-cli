import React from "react";
import { Box, Text } from "ink";

import type { DashMode } from "./useDashState.js";

interface Props {
  query: string;
  mode: DashMode | "search";
}

const MODE_LABELS: Record<DashMode | "search", { text: string; color: string }> = {
  tree: { text: "tree", color: "cyan" },
  flat: { text: "flat", color: "blue" },
  favourites: { text: "★ favs", color: "yellow" },
  search: { text: "search", color: "magenta" },
};

export function SearchInput({ query, mode }: Props) {
  const label = MODE_LABELS[mode];
  return (
    <Box>
      <Text color={label.color}>{label.text} </Text>
      <Text color="gray">› </Text>
      <Text>{query}</Text>
      <Text color="gray" inverse={query.length === 0}>
        {query.length === 0 ? " " : "_"}
      </Text>
      {query.length === 0 && <Text color="gray"> type to filter…</Text>}
    </Box>
  );
}

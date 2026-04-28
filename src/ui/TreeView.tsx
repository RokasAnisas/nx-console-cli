import React from "react";
import { Box, Text } from "ink";

import type { VisibleItem } from "./useDashState.js";

interface Props {
  items: VisibleItem[];
  selectedIndex: number;
  height: number;
}

export function TreeView({ items, selectedIndex, height }: Props) {
  const { start, slice, hasOverflow } = computeWindow(items.length, selectedIndex, height);
  const visible = items.slice(start, start + slice);

  return (
    <Box flexDirection="column">
      {visible.map((item, i) => {
        const absoluteIndex = start + i;
        const isSelected = absoluteIndex === selectedIndex;
        return <TreeRow key={item.id} item={item} isSelected={isSelected} />;
      })}
      {hasOverflow && (
        <Text color="gray" dimColor>
          {selectedIndex + 1} / {items.length}
        </Text>
      )}
    </Box>
  );
}

function TreeRow({ item, isSelected }: { item: VisibleItem; isSelected: boolean }) {
  const indent = "  ".repeat(item.depth);
  const glyph = item.kind === "project"
    ? item.expanded ? "▾" : "▸"
    : item.kind === "target"
      ? item.hasChildren
        ? item.expanded ? "▾" : "▸"
        : "•"
      : "·";

  const labelColor = item.kind === "project"
    ? "cyan"
    : item.kind === "target"
      ? "yellow"
      : "magenta";

  return (
    <Box>
      <Text inverse={isSelected}>
        {indent}
        <Text color="gray">{glyph} </Text>
        <Text color={labelColor} bold={item.kind === "project"}>
          {item.label}
        </Text>
        {item.kind === "target" && item.hasChildren && (
          <Text color="gray" dimColor>
            {" "}
            ({"configs"})
          </Text>
        )}
        {item.isFavourite && <Text color="yellow"> ★</Text>}
      </Text>
    </Box>
  );
}

function computeWindow(total: number, selected: number, height: number) {
  if (total <= height) return { start: 0, slice: total, hasOverflow: false };
  const visible = Math.max(1, height - 1);
  const half = Math.floor(visible / 2);
  let start = Math.max(0, selected - half);
  if (start + visible > total) start = total - visible;
  return { start, slice: visible, hasOverflow: true };
}

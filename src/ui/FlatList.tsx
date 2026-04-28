import React from "react";
import { Box, Text } from "ink";

import type { VisibleItem } from "./useDashState.js";

interface Props {
  items: VisibleItem[];
  selectedIndex: number;
  height: number;
}

export function FlatList({ items, selectedIndex, height }: Props) {
  const { start, slice, hasOverflow } = computeWindow(items.length, selectedIndex, height);
  const visible = items.slice(start, start + slice);

  return (
    <Box flexDirection="column">
      {visible.map((item, i) => {
        const absoluteIndex = start + i;
        const isSelected = absoluteIndex === selectedIndex;
        return <FlatRow key={item.id} item={item} isSelected={isSelected} />;
      })}
      {hasOverflow && (
        <Text color="gray" dimColor>
          {selectedIndex + 1} / {items.length}
        </Text>
      )}
    </Box>
  );
}

function FlatRow({ item, isSelected }: { item: VisibleItem; isSelected: boolean }) {
  const glyph = item.kind === "configuration" ? "·" : "▸";
  const positions = item.matchPositions;

  return (
    <Box>
      <Text inverse={isSelected}>
        <Text color="gray">{glyph} </Text>
        {positions ? <Highlighted text={item.label} positions={positions} /> : <Text>{item.label}</Text>}
        {item.isFavourite && <Text color="yellow"> ★</Text>}
      </Text>
    </Box>
  );
}

function Highlighted({ text, positions }: { text: string; positions: Set<number> }) {
  const chars: React.ReactNode[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? "";
    if (positions.has(i)) {
      chars.push(
        <Text key={i} color="green" bold>
          {ch}
        </Text>,
      );
    } else {
      chars.push(<Text key={i}>{ch}</Text>);
    }
  }
  return <>{chars}</>;
}

function computeWindow(total: number, selected: number, height: number) {
  if (total <= height) return { start: 0, slice: total, hasOverflow: false };
  const visible = Math.max(1, height - 1);
  const half = Math.floor(visible / 2);
  let start = Math.max(0, selected - half);
  if (start + visible > total) start = total - visible;
  return { start, slice: visible, hasOverflow: true };
}

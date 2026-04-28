import React, { useEffect } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";

import { useDashState, type DashMode } from "./useDashState.js";
import { SearchInput } from "./SearchInput.js";
import { TreeView } from "./TreeView.js";
import { FlatList } from "./FlatList.js";
import { Logo } from "./Logo.js";
import { Shortcuts } from "./Shortcuts.js";
import { useSpinnerFrame } from "./useSpinnerFrame.js";
import type { Project, Selection } from "../types.js";

interface Props {
  projects: Project[];
  source: "nx" | "glob";
  warning?: string;
  refreshing?: boolean;
  workspaceRoot: string;
  version: string;
  initialMode: DashMode;
  initialFavourites: Set<string>;
  onFavouritesChange: (favourites: Set<string>) => void;
  onModeChange: (mode: DashMode) => void;
  onSelect: (selection: Selection) => void;
}

const COMPACT_HEADER_ROWS = 6;
const FULL_HEADER_ROWS_WIDE = 12;
const FULL_HEADER_ROWS_NARROW = 13;
const SHORTCUTS_NO_WRAP_WIDTH = 100;

export function App({
  projects,
  source,
  warning,
  refreshing,
  workspaceRoot,
  version,
  initialMode,
  initialFavourites,
  onFavouritesChange,
  onModeChange,
  onSelect,
}: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const state = useDashState(projects, {
    initialMode,
    initialFavourites,
    onFavouritesChange,
    onModeChange,
  });
  const { items, selectedIndex, effectiveMode, query, mode, favouritesEmpty } = state;

  const rows = stdout?.rows ?? 24;
  const cols = stdout?.columns ?? 80;
  const compactLayout = cols < 60;
  const headerRows = compactLayout
    ? COMPACT_HEADER_ROWS
    : cols >= SHORTCUTS_NO_WRAP_WIDTH
      ? FULL_HEADER_ROWS_WIDE
      : FULL_HEADER_ROWS_NARROW;
  const listHeight = Math.max(5, rows - headerRows - (warning ? 1 : 0));

  useEffect(() => {
    if (projects.length === 0) {
      const t = setTimeout(() => exit(), 50);
      return () => clearTimeout(t);
    }
  }, [projects.length, exit]);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }
    if (key.escape) {
      if (query) state.clearQuery();
      else exit();
      return;
    }
    if (key.tab) {
      state.toggleMode();
      return;
    }
    if (key.upArrow) {
      state.moveUp();
      return;
    }
    if (key.downArrow) {
      state.moveDown();
      return;
    }
    if (key.pageUp) {
      state.pageUp(listHeight);
      return;
    }
    if (key.pageDown) {
      state.pageDown(listHeight);
      return;
    }
    if (key.return) {
      const item = items[selectedIndex];
      if (!item) return;
      if (item.kind === "project") {
        state.toggleExpand(item.id);
        return;
      }
      if (item.selection) onSelect(item.selection);
      return;
    }
    if (key.rightArrow) {
      if (key.shift) state.toggleFavouriteSelected();
      else state.expandSelected();
      return;
    }
    if (key.leftArrow) {
      state.collapseSelected();
      return;
    }
    if (key.backspace || key.delete) {
      state.popFromQuery();
      return;
    }
    if (input && !key.ctrl && !key.meta && isPrintable(input)) {
      state.appendToQuery(input);
    }
  });

  const showEmptyFavouritesHint = mode === "favourites" && !query && favouritesEmpty;

  return (
    <Box flexDirection="column">
      <Logo version={version} terminalWidth={cols} />
      <Box marginTop={1}>
        <Shortcuts terminalWidth={cols} />
      </Box>
      {warning && (
        <Text color="yellow" dimColor>
          ⚠ {warning}
        </Text>
      )}
      <Box marginTop={1}>
        <InfoLine
          projectCount={projects.length}
          source={source}
          workspaceRoot={workspaceRoot}
          refreshing={refreshing}
        />
      </Box>
      <SearchInput query={query} mode={effectiveMode} />
      <Box height={listHeight} flexDirection="column" flexShrink={0}>
        {showEmptyFavouritesHint ? (
          <Box flexDirection="column">
            <Text color="yellow">★ No favourites yet.</Text>
            <Text color="gray" dimColor>
              Press <Text color="cyan">Shift+→</Text> on a target to add it. Press{" "}
              <Text color="cyan">Tab</Text> to switch back.
            </Text>
          </Box>
        ) : items.length === 0 ? (
          <Text color="gray" dimColor>
            {projects.length === 0 ? "No projects found." : "No matches."}
          </Text>
        ) : effectiveMode === "tree" ? (
          <TreeView items={items} selectedIndex={selectedIndex} height={listHeight} />
        ) : (
          <FlatList items={items} selectedIndex={selectedIndex} height={listHeight} />
        )}
      </Box>
    </Box>
  );
}

function InfoLine({
  projectCount,
  source,
  workspaceRoot,
  refreshing,
}: {
  projectCount: number;
  source: "nx" | "glob";
  workspaceRoot: string;
  refreshing?: boolean;
}) {
  return (
    <Box>
      <Text color="green">{projectCount}</Text>
      <Text color="gray"> projects </Text>
      <Text color="gray" dimColor>
        ·{" "}
      </Text>
      <Text color="gray">{source === "nx" ? "via nx show" : "via project.json"}</Text>
      <Text color="gray" dimColor>
        {" "}
        ·{" "}
      </Text>
      <Text color="gray" dimColor>
        {workspaceRoot}
      </Text>
      {refreshing && <RefreshIndicator />}
    </Box>
  );
}

function RefreshIndicator() {
  const frame = useSpinnerFrame();
  return (
    <>
      <Text color="gray" dimColor>
        {" "}
        ·{" "}
      </Text>
      <Text color="cyan">{frame}</Text>
      <Text color="gray" dimColor>
        {" "}
        refreshing…
      </Text>
    </>
  );
}

function isPrintable(s: string): boolean {
  if (s.length === 0) return false;
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return false;
  }
  return true;
}

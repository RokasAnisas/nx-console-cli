import React, { useEffect } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";

import { useDashState, type DashMode } from "./useDashState.js";
import { SearchInput } from "./SearchInput.js";
import { TabBar } from "./TabBar.js";
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
  affected: Set<string>;
  workspaceRoot: string;
  version: string;
  initialMode: DashMode;
  initialFavourites: Set<string>;
  initialRecent: string[];
  onFavouritesChange: (favourites: Set<string>) => void;
  onRecentChange: (recent: string[]) => void;
  onModeChange: (mode: DashMode) => void;
  onSelect: (selection: Selection) => void;
}

const HEADER_ROWS_FULL = 9;
const HEADER_ROWS_WRAPPED = 10;
const SHORTCUTS_NO_WRAP_WIDTH = 100;
const SKIP_STEP = 5;

export function App({
  projects,
  source,
  warning,
  refreshing,
  affected,
  workspaceRoot,
  version,
  initialMode,
  initialFavourites,
  initialRecent,
  onFavouritesChange,
  onRecentChange,
  onModeChange,
  onSelect,
}: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const state = useDashState(projects, {
    initialMode,
    initialFavourites,
    initialRecent,
    affected,
    onFavouritesChange,
    onRecentChange,
    onModeChange,
  });
  const {
    items,
    selectedIndex,
    effectiveMode,
    query,
    mode,
    favouritesEmpty,
    modifiedEmpty,
    recentEmpty,
  } = state;

  const rows = stdout?.rows ?? 24;
  const cols = stdout?.columns ?? 80;
  const headerRows = cols >= SHORTCUTS_NO_WRAP_WIDTH ? HEADER_ROWS_FULL : HEADER_ROWS_WRAPPED;
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
      state.toggleMode(key.shift ? -1 : 1);
      return;
    }
    if (key.upArrow) {
      if (key.shift) state.pageUp(SKIP_STEP);
      else state.moveUp();
      return;
    }
    if (key.downArrow) {
      if (key.shift) state.pageDown(SKIP_STEP);
      else state.moveDown();
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
      if (item.selection) {
        state.recordRecentSelected();
        onSelect(item.selection);
      }
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
  const showEmptyModifiedHint = mode === "modified" && !query && modifiedEmpty;
  const showEmptyRecentHint = mode === "recent" && !query && recentEmpty;

  return (
    <Box flexDirection="column">
      <Logo version={version} />
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
      <Box marginTop={1}>
        <TabBar mode={mode} searching={effectiveMode === "search"} />
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
        ) : showEmptyModifiedHint ? (
          <Box flexDirection="column">
            <Text color="cyan">● No modified projects.</Text>
            <Text color="gray" dimColor>
              Edit a file in a project, or check that <Text color="cyan">nx</Text> supports{" "}
              <Text color="cyan">show projects --affected</Text>.
            </Text>
          </Box>
        ) : showEmptyRecentHint ? (
          <Box flexDirection="column">
            <Text color="green">↻ No recent runs.</Text>
            <Text color="gray" dimColor>
              Press <Text color="cyan">Enter</Text> on a target to record it. Up to{" "}
              <Text color="cyan">5</Text> recent targets are kept.
            </Text>
          </Box>
        ) : items.length === 0 ? (
          <Text color="gray" dimColor>
            {projects.length === 0 ? "No projects found." : "No matches."}
          </Text>
        ) : effectiveMode === "tree" || effectiveMode === "modified" ? (
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

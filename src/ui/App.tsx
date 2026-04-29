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

const SHORTCUTS_NO_WRAP_WIDTH = 100;
const SKIP_STEP = 5;
const HEADER_ROWS = 6;
const FOOTER_ROWS_FULL = 3;
const FOOTER_ROWS_WRAPPED = 4;

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
  const { items, selectedIndex, effectiveMode, query, mode } = state;

  const rows = stdout?.rows ?? 24;
  const cols = stdout?.columns ?? 80;
  const footerRows = cols >= SHORTCUTS_NO_WRAP_WIDTH ? FOOTER_ROWS_FULL : FOOTER_ROWS_WRAPPED;
  const listHeight = Math.max(5, rows - HEADER_ROWS - footerRows - (warning ? 1 : 0));

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

  const noItems = items.length === 0;
  const showEmptyFavouritesHint = mode === "favourites" && !query && noItems;
  const showEmptyModifiedHint = mode === "modified" && !query && noItems;
  const showEmptyRecentHint = mode === "recent" && !query && noItems;

  return (
    <Box flexDirection="column">
      <Logo version={version} />
      <InfoLine
        projectCount={projects.length}
        source={source}
        workspaceRoot={workspaceRoot}
        refreshing={refreshing}
      />
      {warning && (
        <Box>
          <Text color="yellow">{"  ⚠ "}</Text>
          <Text color="yellow" dimColor>
            {warning}
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <TabBar mode={mode} searching={effectiveMode === "search"} />
      </Box>
      <SearchInput query={query} mode={effectiveMode} />
      <Box height={listHeight} flexDirection="column" flexShrink={0}>
        {showEmptyFavouritesHint ? (
          <EmptyHint
            color="yellow"
            glyph="★"
            title="No favourites yet."
            body={
              <>
                Press <Text color="cyan">Shift+→</Text> on a target to add it. Press{" "}
                <Text color="cyan">Tab</Text> to switch back.
              </>
            }
          />
        ) : showEmptyModifiedHint ? (
          <EmptyHint
            color="cyanBright"
            glyph="●"
            title="No modified projects."
            body={
              <>
                Edit a file in a project, or check that <Text color="cyan">nx</Text> supports{" "}
                <Text color="cyan">show projects --affected</Text>.
              </>
            }
          />
        ) : showEmptyRecentHint ? (
          <EmptyHint
            color="green"
            glyph="↻"
            title="No recent runs."
            body={
              <>
                Press <Text color="cyan">Enter</Text> on a target to record it. Up to{" "}
                <Text color="cyan">5</Text> recent targets are kept.
              </>
            }
          />
        ) : items.length === 0 ? (
          <Box paddingLeft={2} paddingTop={1}>
            <Text color="gray" dimColor>
              {projects.length === 0 ? "No projects found." : "No matches."}
            </Text>
          </Box>
        ) : effectiveMode === "tree" || effectiveMode === "modified" ? (
          <TreeView items={items} selectedIndex={selectedIndex} height={listHeight} />
        ) : (
          <FlatList items={items} selectedIndex={selectedIndex} height={listHeight} />
        )}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Rule width={cols} />
        <Shortcuts terminalWidth={cols} />
      </Box>
    </Box>
  );
}

function Rule({ width }: { width: number }) {
  return (
    <Text color="gray" dimColor>
      {"─".repeat(Math.max(1, width))}
    </Text>
  );
}

function EmptyHint({
  color,
  glyph,
  title,
  body,
}: {
  color: string;
  glyph: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <Box flexDirection="column" paddingLeft={2} paddingTop={1}>
      <Box>
        <Text color={color} bold>
          {glyph}
        </Text>
        <Text color={color}> {title}</Text>
      </Box>
      <Text color="gray" dimColor>
        {body}
      </Text>
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
      <Text color="gray" dimColor>
        {"  "}
      </Text>
      <Text color="green" bold>
        {projectCount}
      </Text>
      <Text color="gray" dimColor>
        {" projects"}
      </Text>
      <Text color="gray" dimColor>
        {"   ·   "}
      </Text>
      <Text color="gray">{source === "nx" ? "via nx show" : "via project.json"}</Text>
      <Text color="gray" dimColor>
        {"   ·   "}
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
        {"   ·   "}
      </Text>
      <Text color="cyan">{frame}</Text>
      <Text color="gray" dimColor>
        {" refreshing…"}
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

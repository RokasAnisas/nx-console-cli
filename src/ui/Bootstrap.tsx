import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useStdout } from "ink";

import { App } from "./App.js";
import { LoadingScreen } from "./LoadingScreen.js";
import { Logo } from "./Logo.js";
import { loadProjects, type LoadProgress, type LoadResult } from "../workspace/loadProjects.js";
import type { DashMode } from "./useDashState.js";
import type { Selection } from "../types.js";

interface Props {
  workspaceRoot: string;
  version: string;
  initialMode: DashMode;
  initialFavourites: Set<string>;
  onFavouritesChange: (favourites: Set<string>) => void;
  onModeChange: (mode: DashMode) => void;
  onSelect: (selection: Selection) => void;
}

type LoadState =
  | { status: "loading"; progress: LoadProgress | null }
  | { status: "ready"; result: LoadResult }
  | { status: "error"; message: string };

export function Bootstrap(props: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const [state, setState] = useState<LoadState>({ status: "loading", progress: null });

  useEffect(() => {
    let cancelled = false;
    loadProjects(props.workspaceRoot, (progress) => {
      if (cancelled) return;
      setState((prev) => (prev.status === "loading" ? { ...prev, progress } : prev));
    })
      .then((result) => {
        if (cancelled) return;
        setState({ status: "ready", result });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: "error", message: (err as Error).message });
      });
    return () => {
      cancelled = true;
    };
  }, [props.workspaceRoot]);

  useEffect(() => {
    if (state.status !== "error") return;
    const t = setTimeout(() => exit(), 80);
    return () => clearTimeout(t);
  }, [state.status, exit]);

  if (state.status === "loading") {
    return (
      <LoadingScreen
        version={props.version}
        workspaceRoot={props.workspaceRoot}
        terminalWidth={cols}
        progress={state.progress}
      />
    );
  }

  if (state.status === "error") {
    return (
      <Box flexDirection="column">
        <Logo version={props.version} terminalWidth={cols} />
        <Box marginTop={1}>
          <Text color="red">✖ Failed to load projects: </Text>
          <Text>{state.message}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <App
      projects={state.result.projects}
      source={state.result.source}
      warning={state.result.warning}
      workspaceRoot={props.workspaceRoot}
      version={props.version}
      initialMode={props.initialMode}
      initialFavourites={props.initialFavourites}
      onFavouritesChange={props.onFavouritesChange}
      onModeChange={props.onModeChange}
      onSelect={props.onSelect}
    />
  );
}

import React from "react";
import { render } from "ink";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { Bootstrap } from "./ui/Bootstrap.js";
import { findWorkspaceRoot } from "./workspace/findRoot.js";
import { runTarget, buildTargetSpec } from "./runner/runTarget.js";
import { loadFavourites, saveFavourites } from "./favourites/store.js";
import { loadPreferences, savePreferences } from "./preferences/store.js";
import type { Selection } from "./types.js";

interface Args {
  help: boolean;
  version: boolean;
  dryRun: boolean;
  cwd: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    help: false,
    version: false,
    dryRun: false,
    cwd: process.cwd(),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "-v" || a === "--version") args.version = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--cwd") {
      const next = argv[i + 1];
      if (next) {
        args.cwd = next;
        i++;
      }
    }
  }
  return args;
}

function readPackageVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printHelp() {
  process.stdout.write(
    [
      "nx-dash — terminal NX Console",
      "",
      "USAGE",
      "  nx-dash [--cwd <path>] [--dry-run]",
      "",
      "OPTIONS",
      "  -h, --help       Show this help",
      "  -v, --version    Print version",
      "      --cwd PATH   Run as if launched from PATH (defaults to cwd)",
      "      --dry-run    Print the resolved nx command instead of executing it",
      "",
      "KEYS",
      "  ↑/↓        Move selection",
      "  Shift+↑/↓  Skip 5 items at a time",
      "  ←/→        Collapse / expand",
      "  Enter      Run selected target (or expand selected project)",
      "  Tab        Cycle tree / flat / ★ favourites",
      "  Shift+→    Toggle ★ favourite on selected target",
      "  type       Filter (auto-switches to ranked flat mode)",
      "  Esc        Clear filter, then quit",
      "  Ctrl-C     Quit",
      "",
      "FAVOURITES",
      "  Stored in <workspace>/.nx-dash/favourites.json (auto-gitignored)",
      "",
    ].join("\n"),
  );
}

const ALT_SCREEN_ENTER = "\x1B[?1049h";
const ALT_SCREEN_EXIT = "\x1B[?1049l";

let altScreenActive = false;

function setAltScreen(enable: boolean): void {
  if (!process.stdout.isTTY) return;
  if (enable === altScreenActive) return;
  process.stdout.write(enable ? ALT_SCREEN_ENTER : ALT_SCREEN_EXIT);
  altScreenActive = enable;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.version) {
    process.stdout.write(`${readPackageVersion()}\n`);
    return 0;
  }

  const workspaceRoot = findWorkspaceRoot(args.cwd);
  if (!workspaceRoot) {
    process.stderr.write(
      `nx-dash: no NX workspace found (looked for nx.json above ${args.cwd}).\n`,
    );
    return 1;
  }

  // Restore the alt screen if the process is killed before normal exit.
  // These handlers must be removed once the TUI unmounts so they don't
  // interfere with `runTarget`'s SIGINT/SIGTERM forwarding to the nx child.
  setAltScreen(true);
  const onProcessExit = () => setAltScreen(false);
  process.on("exit", onProcessExit);
  const signalHandlers: Array<[NodeJS.Signals, () => void]> = (
    ["SIGINT", "SIGTERM", "SIGHUP"] as const
  ).map((sig) => {
    const handler = () => {
      setAltScreen(false);
      process.exit(sig === "SIGINT" ? 130 : sig === "SIGTERM" ? 143 : 129);
    };
    process.on(sig, handler);
    return [sig, handler];
  });

  function detachLifecycleHandlers() {
    process.off("exit", onProcessExit);
    for (const [sig, handler] of signalHandlers) process.off(sig, handler);
  }

  let selection: Selection | null = null;
  const version = readPackageVersion();
  const initialFavourites = loadFavourites(workspaceRoot);
  const { lastMode } = loadPreferences(workspaceRoot);

  const ui = render(
    <Bootstrap
      workspaceRoot={workspaceRoot}
      version={version}
      initialMode={lastMode}
      initialFavourites={initialFavourites}
      onFavouritesChange={(favourites) => {
        try {
          saveFavourites(workspaceRoot, favourites);
        } catch (err) {
          process.stderr.write(
            `nx-dash: failed to persist favourites: ${(err as Error).message}\n`,
          );
        }
      }}
      onModeChange={(mode) => {
        try {
          savePreferences(workspaceRoot, { lastMode: mode });
        } catch (err) {
          process.stderr.write(
            `nx-dash: failed to persist preferences: ${(err as Error).message}\n`,
          );
        }
      }}
      onSelect={(s) => {
        selection = s;
        ui.unmount();
      }}
    />,
    { exitOnCtrlC: false },
  );

  await ui.waitUntilExit();
  setAltScreen(false);
  detachLifecycleHandlers();

  if (!selection) return 0;

  if (args.dryRun) {
    process.stdout.write(`[dry-run] nx run ${buildTargetSpec(selection)}\n`);
    return 0;
  }

  const code = await runTarget({ workspaceRoot, selection });
  return code;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((err) => {
    process.stderr.write(`nx-dash: ${err?.message ?? err}\n`);
    process.exit(1);
  });

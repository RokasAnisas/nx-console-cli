import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ensureSelfIgnoredDir, nxDashDir } from "../storage/workspaceDir.js";
import type { DashMode } from "../ui/useDashState.js";

const FILE_NAME = "preferences.json";
const FILE_VERSION = 1;
const DEFAULT_MODE: DashMode = "tree";

interface PreferencesFile {
  version: number;
  lastMode: DashMode;
}

export interface Preferences {
  lastMode: DashMode;
}

export function loadPreferences(workspaceRoot: string): Preferences {
  const path = join(nxDashDir(workspaceRoot), FILE_NAME);
  if (!existsSync(path)) return { lastMode: DEFAULT_MODE };
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as Partial<PreferencesFile>;
    return { lastMode: isValidMode(json.lastMode) ? json.lastMode : DEFAULT_MODE };
  } catch {
    return { lastMode: DEFAULT_MODE };
  }
}

export function savePreferences(workspaceRoot: string, preferences: Preferences): void {
  const dir = ensureSelfIgnoredDir(workspaceRoot);
  const data: PreferencesFile = {
    version: FILE_VERSION,
    lastMode: preferences.lastMode,
  };
  writeFileSync(join(dir, FILE_NAME), JSON.stringify(data, null, 2) + "\n", "utf8");
}

function isValidMode(m: unknown): m is DashMode {
  return m === "tree" || m === "flat" || m === "favourites" || m === "modified";
}

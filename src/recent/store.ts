import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ensureSelfIgnoredDir, nxDashDir } from "../storage/workspaceDir.js";

const FILE_NAME = "recent.json";
const FILE_VERSION = 1;
export const MAX_RECENT = 5;

interface RecentFile {
  version: number;
  items: string[];
}

export function loadRecent(workspaceRoot: string): string[] {
  const path = join(nxDashDir(workspaceRoot), FILE_NAME);
  if (!existsSync(path)) return [];
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as Partial<RecentFile>;
    if (Array.isArray(json.items)) {
      return json.items
        .filter((x): x is string => typeof x === "string")
        .slice(0, MAX_RECENT);
    }
  } catch {
    // corrupt — start fresh
  }
  return [];
}

export function saveRecent(workspaceRoot: string, items: string[]): void {
  const dir = ensureSelfIgnoredDir(workspaceRoot);
  const data: RecentFile = {
    version: FILE_VERSION,
    items: items.slice(0, MAX_RECENT),
  };
  writeFileSync(join(dir, FILE_NAME), JSON.stringify(data, null, 2) + "\n", "utf8");
}

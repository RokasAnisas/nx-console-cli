import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ensureSelfIgnoredDir, nxDashDir } from "../storage/workspaceDir.js";

const FILE_NAME = "favourites.json";
const FILE_VERSION = 1;

interface FavouritesFile {
  version: number;
  favourites: string[];
}

export function favouritesDir(workspaceRoot: string): string {
  return nxDashDir(workspaceRoot);
}

export function loadFavourites(workspaceRoot: string): Set<string> {
  const path = join(nxDashDir(workspaceRoot), FILE_NAME);
  if (!existsSync(path)) return new Set();
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as Partial<FavouritesFile>;
    if (Array.isArray(json.favourites)) {
      return new Set(json.favourites.filter((x): x is string => typeof x === "string"));
    }
  } catch {
    // corrupt — start fresh
  }
  return new Set();
}

export function saveFavourites(workspaceRoot: string, favourites: Set<string>): void {
  const dir = ensureSelfIgnoredDir(workspaceRoot);
  const data: FavouritesFile = {
    version: FILE_VERSION,
    favourites: Array.from(favourites),
  };
  writeFileSync(join(dir, FILE_NAME), JSON.stringify(data, null, 2) + "\n", "utf8");
}

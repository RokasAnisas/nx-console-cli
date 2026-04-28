import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ensureSelfIgnoredDir, nxDashDir } from "../storage/workspaceDir.js";
import type { Project } from "../types.js";

const FILE_NAME = "projects-cache.json";
const FILE_VERSION = 1;

interface CacheFile {
  version: number;
  savedAt: string;
  source: "nx" | "glob";
  projects: Project[];
}

export interface CachedProjects {
  source: "nx" | "glob";
  projects: Project[];
  savedAt: string;
}

export function loadCachedProjects(workspaceRoot: string): CachedProjects | null {
  const path = join(nxDashDir(workspaceRoot), FILE_NAME);
  if (!existsSync(path)) return null;
  try {
    const json = JSON.parse(readFileSync(path, "utf8")) as Partial<CacheFile>;
    if (json.version !== FILE_VERSION) return null;
    if (json.source !== "nx" && json.source !== "glob") return null;
    if (!Array.isArray(json.projects)) return null;
    return {
      source: json.source,
      projects: json.projects as Project[],
      savedAt: typeof json.savedAt === "string" ? json.savedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCachedProjects(
  workspaceRoot: string,
  source: "nx" | "glob",
  projects: Project[],
): void {
  const dir = ensureSelfIgnoredDir(workspaceRoot);
  const data: CacheFile = {
    version: FILE_VERSION,
    savedAt: new Date().toISOString(),
    source,
    projects,
  };
  writeFileSync(join(dir, FILE_NAME), JSON.stringify(data) + "\n", "utf8");
}

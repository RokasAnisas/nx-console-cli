import { existsSync } from "node:fs";
import { join } from "node:path";

export interface NxBin {
  cmd: string;
  args: string[];
}

// Local nx ships as `nx.cmd` (and `nx.ps1`) on Windows; everywhere else it's `nx`.
const LOCAL_CANDIDATES = process.platform === "win32" ? ["nx.cmd", "nx.ps1", "nx"] : ["nx"];

export function resolveNxBin(workspaceRoot: string): NxBin | null {
  const binDir = join(workspaceRoot, "node_modules", ".bin");
  for (const candidate of LOCAL_CANDIDATES) {
    const local = join(binDir, candidate);
    if (existsSync(local)) return { cmd: local, args: [] };
  }
  return null;
}

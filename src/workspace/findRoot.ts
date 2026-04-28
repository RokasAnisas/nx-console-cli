import { existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { homedir } from "node:os";

export function findWorkspaceRoot(startDir: string = process.cwd()): string | null {
  const root = parse(startDir).root;
  const home = homedir();
  let dir = startDir;

  while (true) {
    if (existsSync(join(dir, "nx.json"))) return dir;

    if (dir === root || dir === home) return null;

    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

import { existsSync } from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import { homedir } from "node:os";

export function findWorkspaceRoot(startDir: string = process.cwd()): string | null {
  // Resolve to an absolute path so `parse(startDir).root` returns the actual
  // filesystem root and the walk doesn't terminate early on a relative cwd.
  const absolute = resolve(startDir);
  const root = parse(absolute).root;
  const home = homedir();
  let dir = absolute;

  while (true) {
    if (existsSync(join(dir, "nx.json"))) return dir;

    if (dir === root || dir === home) return null;

    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

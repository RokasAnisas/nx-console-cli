import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Selection } from "../types.js";

export interface RunOptions {
  workspaceRoot: string;
  selection: Selection;
  dryRun?: boolean;
}

export function buildTargetSpec(selection: Selection): string {
  if (selection.kind === "configuration") {
    return `${selection.project}:${selection.target}:${selection.configuration}`;
  }
  return `${selection.project}:${selection.target}`;
}

export function resolveNxBin(workspaceRoot: string): { cmd: string; args: string[] } {
  const local = join(workspaceRoot, "node_modules", ".bin", "nx");
  if (existsSync(local)) return { cmd: local, args: [] };
  return { cmd: "npx", args: ["--no-install", "nx"] };
}

export function runTarget({ workspaceRoot, selection, dryRun }: RunOptions): Promise<number> {
  const { cmd, args: prefix } = resolveNxBin(workspaceRoot);
  const args = [...prefix, "run", buildTargetSpec(selection)];

  if (dryRun) {
    process.stdout.write(`[dry-run] cwd=${workspaceRoot}\n`);
    process.stdout.write(`[dry-run] ${cmd} ${args.join(" ")}\n`);
    return Promise.resolve(0);
  }

  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: workspaceRoot, stdio: "inherit" });

    const forward = (sig: NodeJS.Signals) => {
      if (!child.killed) child.kill(sig);
    };
    process.on("SIGINT", forward);
    process.on("SIGTERM", forward);
    process.on("SIGHUP", forward);

    child.on("error", (err) => {
      process.stderr.write(`Failed to start nx: ${err.message}\n`);
      cleanup();
      resolve(1);
    });

    child.on("exit", (code, signal) => {
      cleanup();
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      resolve(code ?? 0);
    });

    function cleanup() {
      process.off("SIGINT", forward);
      process.off("SIGTERM", forward);
      process.off("SIGHUP", forward);
    }
  });
}
